const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const generateOrderNumber = require('../utils/generateOrderNumber');
const escapeRegex = require('../utils/escapeRegex');
const { ORDER_TRANSITIONS, CUSTOMER_CANCELLABLE, ROLES } = require('../utils/constants');
const { round } = require('./cart.service');
const { canManage } = require('./access.service');

// ---------- coupons ----------
function computeDiscount(coupon, subtotal) {
  let discount = coupon.discountType === 'percentage' ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.maximumDiscount != null) discount = Math.min(discount, coupon.maximumDiscount);
  return round(Math.min(discount, subtotal));
}

async function findValidCoupon(code, restaurantId, subtotal) {
  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.isActive) throw ApiError.unprocessable('Invalid coupon code');
  if (coupon.expiryDate < new Date()) throw ApiError.unprocessable('This coupon has expired');
  if (coupon.restaurant && String(coupon.restaurant) !== String(restaurantId)) {
    throw ApiError.unprocessable('This coupon is not valid for this restaurant');
  }
  if (subtotal < coupon.minimumOrder) {
    throw ApiError.unprocessable(`Minimum order of ${coupon.minimumOrder} required for this coupon`);
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.unprocessable('This coupon has reached its usage limit');
  }
  return coupon;
}

// Atomically claims one use (single conditional $inc) so two concurrent checkouts cannot exceed usageLimit.
async function reserveCoupon(coupon) {
  const filter = { _id: coupon._id, isActive: true };
  if (coupon.usageLimit != null) filter.usedCount = { $lt: coupon.usageLimit };
  const res = await Coupon.updateOne(filter, { $inc: { usedCount: 1 } });
  if (!res.modifiedCount) throw ApiError.unprocessable('This coupon has reached its usage limit');
}
const releaseCoupon = (coupon) => Coupon.updateOne({ _id: coupon._id, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });

// ---------- place order ----------
async function createOrder(user, { deliveryAddress, phone, paymentMethod, notes, couponCode }) {
  const cart = await Cart.findOne({ user: user._id });
  if (!cart || !cart.items.length) throw ApiError.badRequest('Your cart is empty');

  const restaurant = await Restaurant.findById(cart.restaurant);
  if (!restaurant || !restaurant.isActive) throw ApiError.conflict('This restaurant is not accepting orders');
  if (!restaurant.isOpen) throw ApiError.conflict('This restaurant is currently closed');

  // Re-read every item from the DB: availability, ownership and *current* prices.
  const menuDocs = await MenuItem.find({ _id: { $in: cart.items.map((i) => i.menuItem) } });
  const byId = new Map(menuDocs.map((d) => [String(d._id), d]));
  const problems = [];
  const items = [];
  for (const ci of cart.items) {
    const doc = byId.get(String(ci.menuItem));
    if (!doc) problems.push({ menuItem: String(ci.menuItem), name: ci.name, reason: 'removed_from_menu' });
    else if (String(doc.restaurant) !== String(restaurant._id)) problems.push({ menuItem: String(doc._id), name: doc.name, reason: 'wrong_restaurant' });
    else if (!doc.isAvailable) problems.push({ menuItem: String(doc._id), name: doc.name, reason: 'unavailable' });
    else {
      items.push({
        menuItem: doc._id, name: doc.name, price: doc.finalPrice, quantity: ci.quantity,
        subtotal: round(doc.finalPrice * ci.quantity),
      });
    }
  }
  if (problems.length) {
    throw ApiError.conflict('Some items in your cart are no longer available. Review your cart and try again', problems);
  }

  const subtotal = round(items.reduce((s, i) => s + i.subtotal, 0));
  if (subtotal < restaurant.minimumOrder) {
    throw ApiError.unprocessable(`Minimum order for this restaurant is ${restaurant.minimumOrder}`);
  }
  const deliveryFee = restaurant.deliveryFee || 0;

  let coupon = null;
  let discount = 0;
  if (couponCode) {
    coupon = await findValidCoupon(couponCode, restaurant._id, subtotal);
    discount = computeDiscount(coupon, subtotal);
    await reserveCoupon(coupon);
  }
  const total = round(subtotal + deliveryFee - discount);

  // Atomically claim the cart so a double-submit cannot create two orders from one cart.
  const claimed = await Cart.findOneAndDelete({ _id: cart._id, updatedAt: cart.updatedAt });
  if (!claimed) {
    if (coupon) await releaseCoupon(coupon);
    throw ApiError.conflict('Your cart changed while placing the order. Please review it and try again');
  }

  try {
    let order;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        order = await Order.create({
          orderNumber: generateOrderNumber(),
          user: user._id,
          restaurant: restaurant._id,
          items, deliveryAddress, phone, subtotal, deliveryFee, discount, total,
          couponCode: coupon ? coupon.code : undefined,
          paymentMethod, paymentStatus: 'pending', orderStatus: 'pending', notes,
          statusHistory: [{ status: 'pending', changedBy: user._id }],
        });
        break;
      } catch (err) {
        if (!(err.code === 11000 && err.keyPattern?.orderNumber)) throw err; // retry only order number collisions
      }
    }
    if (!order) throw new Error('Could not allocate an order number');
    return order;
  } catch (err) {
    // Order was not created: give the customer their cart and coupon use back.
    await Cart.create(claimed.toObject()).catch(() => {});
    if (coupon) await releaseCoupon(coupon);
    throw err;
  }
}

// ---------- reads ----------
async function paginate(filter, { page, limit }, populate = true) {
  const q = Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
  if (populate) q.populate('restaurant', 'name image').populate('user', 'name email phone');
  const [orders, total] = await Promise.all([q, Order.countDocuments(filter)]);
  return { orders, total };
}

function buildFilter({ status, from, to, search, restaurant, user }) {
  const f = {};
  if (status) f.orderStatus = status;
  if (restaurant) f.restaurant = restaurant;
  if (user) f.user = user;
  if (from || to) f.createdAt = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  if (search) f.orderNumber = { $regex: escapeRegex(search), $options: 'i' };
  return f;
}

async function getOrderForUser(user, orderId) {
  const order = await Order.findById(orderId).populate('restaurant', 'name image owner phone').populate('user', 'name email phone');
  if (!order) throw ApiError.notFound('Order not found');
  const isOwner = String(order.user._id) === String(user._id);
  const staffAccess = user.role !== ROLES.CUSTOMER && canManage(user, order.restaurant);
  if (!isOwner && !staffAccess) throw ApiError.forbidden('You do not have access to this order');
  return order;
}

// ---------- mutations ----------
async function cancelOrder(user, orderId, reason) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (String(order.user) !== String(user._id)) throw ApiError.forbidden('You can only cancel your own orders');
  if (!CUSTOMER_CANCELLABLE.includes(order.orderStatus)) {
    throw ApiError.conflict(`Orders that are '${order.orderStatus}' can no longer be cancelled`);
  }
  // Conditional update: loses gracefully if staff moved the order on in the meantime.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: { $in: CUSTOMER_CANCELLABLE } },
    {
      $set: { orderStatus: 'cancelled', ...(order.paymentStatus === 'paid' && { paymentStatus: 'refunded' }) },
      $push: { statusHistory: { status: 'cancelled', changedBy: user._id, changedAt: new Date() } },
    },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('This order can no longer be cancelled');
  if (reason) updated.notes = [updated.notes, `Cancelled: ${reason}`].filter(Boolean).join(' | ');
  if (reason) await updated.save();
  return updated;
}

async function updateStatus(user, orderId, next) {
  const order = await Order.findById(orderId).populate('restaurant', 'owner');
  if (!order) throw ApiError.notFound('Order not found');
  if (!canManage(user, order.restaurant)) throw ApiError.forbidden('You cannot manage orders of this restaurant');

  const allowed = ORDER_TRANSITIONS[order.orderStatus] || [];
  if (!allowed.includes(next)) {
    throw ApiError.unprocessable(
      `Invalid status transition: '${order.orderStatus}' → '${next}'. Allowed: ${allowed.join(', ') || 'none (final status)'}`
    );
  }
  const set = { orderStatus: next };
  if (next === 'delivered' && order.paymentMethod === 'cash') set.paymentStatus = 'paid';
  if (['cancelled', 'rejected'].includes(next) && order.paymentStatus === 'paid') set.paymentStatus = 'refunded';

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, orderStatus: order.orderStatus }, // guards against concurrent transitions
    { $set: set, $push: { statusHistory: { status: next, changedBy: user._id, changedAt: new Date() } } },
    { new: true }
  );
  if (!updated) throw ApiError.conflict('Order status was changed by someone else. Refresh and try again');
  return updated;
}

module.exports = { createOrder, getOrderForUser, cancelOrder, updateStatus, paginate, buildFilter, computeDiscount };
