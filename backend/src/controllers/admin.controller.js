const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const escapeRegex = require('../utils/escapeRegex');
const orderService = require('../services/order.service');
const { getPagination, buildPagination } = require('../utils/pagination');
const { created, ok } = require('../utils/apiResponse');
const { ROLES } = require('../utils/constants');

// ---------- users ----------
exports.listUsers = asyncHandler(async (req, res) => {
  const { search, role, isBlocked } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (isBlocked !== undefined) filter.isBlocked = isBlocked;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const pg = getPagination(req.query);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit),
    User.countDocuments(filter),
  ]);
  ok(res, 'Users fetched successfully', users, buildPagination(pg, total));
});

async function loadTarget(req) {
  const user = await User.findById(req.params.userId).select('+tokenVersion');
  if (!user) throw ApiError.notFound('User not found');
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('You cannot perform this action on your own account');
  return user;
}

const setBlocked = (blocked) => asyncHandler(async (req, res) => {
  const user = await loadTarget(req);
  user.isBlocked = blocked;
  if (blocked) user.tokenVersion += 1; // kick out existing sessions immediately
  await user.save();
  ok(res, blocked ? 'User blocked successfully' : 'User unblocked successfully', user);
});
exports.blockUser = setBlocked(true);
exports.unblockUser = setBlocked(false);

exports.setRole = asyncHandler(async (req, res) => {
  const user = await loadTarget(req);
  if (user.role === ROLES.RESTAURANT_ADMIN && req.body.role !== ROLES.RESTAURANT_ADMIN && (await Restaurant.exists({ owner: user._id }))) {
    throw ApiError.conflict('This user owns a restaurant. Reassign or deactivate it before changing their role');
  }
  user.role = req.body.role;
  user.tokenVersion += 1;
  await user.save();
  ok(res, 'User role updated successfully', user);
});

// ---------- restaurants ----------
exports.listRestaurants = asyncHandler(async (req, res) => {
  const { search, city, isActive, owner } = req.query;
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (owner) filter.owner = owner;
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');
  const pg = getPagination(req.query);
  const [items, total] = await Promise.all([
    Restaurant.find(filter).populate('owner', 'name email').sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit),
    Restaurant.countDocuments(filter),
  ]);
  ok(res, 'Restaurants fetched successfully', items, buildPagination(pg, total));
});

exports.setRestaurantStatus = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  if (!restaurant) throw ApiError.notFound('Restaurant not found');
  restaurant.isActive = req.body.isActive;
  await restaurant.save();
  ok(res, restaurant.isActive ? 'Restaurant activated successfully' : 'Restaurant deactivated successfully', restaurant);
});

// ---------- orders ----------
exports.listOrders = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query);
  const { orders, total } = await orderService.paginate(orderService.buildFilter(req.query), pg);
  ok(res, 'Orders fetched successfully', orders, buildPagination(pg, total));
});

// ---------- dashboard ----------
exports.dashboard = asyncHandler(async (_req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [totalUsers, totalRestaurants, totalOrders, todaysOrders, pendingOrders, completedOrders, revenue] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    Order.aggregate([{ $match: { orderStatus: 'delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
  ]);
  ok(res, 'Dashboard statistics fetched successfully', {
    totalUsers, totalRestaurants, totalOrders,
    totalRevenue: revenue[0]?.total || 0, // delivered orders only
    todaysOrders, pendingOrders, completedOrders,
  });
});

// ---------- coupons ----------
exports.listCoupons = asyncHandler(async (_req, res) => ok(res, 'Coupons fetched successfully', await Coupon.find().sort({ createdAt: -1 })));
exports.createCoupon = asyncHandler(async (req, res) => created(res, 'Coupon created successfully', await Coupon.create(req.body)));
exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.couponId);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  coupon.set(req.body);
  await coupon.save();
  ok(res, 'Coupon updated successfully', coupon);
});
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.couponId);
  if (!coupon) throw ApiError.notFound('Coupon not found');
  ok(res, 'Coupon deleted successfully', null);
});
