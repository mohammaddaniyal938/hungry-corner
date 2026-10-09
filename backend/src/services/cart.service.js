const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');

const round = (n) => Math.round(n * 100) / 100;

function applyTotals(cart, restaurant) {
  cart.subtotal = round(cart.items.reduce((s, i) => s + i.price * i.quantity, 0));
  cart.deliveryFee = cart.items.length ? restaurant?.deliveryFee ?? 0 : 0;
  cart.discount = 0;
  cart.total = round(cart.subtotal + cart.deliveryFee - cart.discount);
}

const emptyCart = () => ({
  items: [], restaurant: null, subtotal: 0, deliveryFee: 0, discount: 0, total: 0, warnings: [],
});

async function present(cart, warnings = []) {
  await cart.populate('restaurant', 'name image isActive isOpen deliveryFee minimumOrder');
  return { ...cart.toJSON(), warnings };
}

// Re-validates the cart against current DB state: prices are refreshed, deleted/unavailable
// items are dropped. Everything removed or changed is reported in `warnings`.
async function syncCart(cart) {
  const warnings = [];
  const restaurant = await Restaurant.findById(cart.restaurant);
  const docs = await MenuItem.find({ _id: { $in: cart.items.map((i) => i.menuItem) } });
  const byId = new Map(docs.map((d) => [String(d._id), d]));

  let changed = false;
  const kept = [];
  for (const item of cart.items) {
    const doc = byId.get(String(item.menuItem));
    if (!doc) {
      warnings.push({ menuItem: item.menuItem, name: item.name, reason: 'removed_from_menu' });
      changed = true;
    } else if (!doc.isAvailable) {
      warnings.push({ menuItem: item.menuItem, name: item.name, reason: 'unavailable' });
      changed = true;
    } else {
      if (item.price !== doc.finalPrice) {
        warnings.push({ menuItem: item.menuItem, name: doc.name, reason: 'price_changed', from: item.price, to: doc.finalPrice });
        changed = true;
      }
      kept.push({ menuItem: doc._id, name: doc.name, image: doc.image, quantity: item.quantity, price: doc.finalPrice });
    }
  }
  if (!restaurant || !restaurant.isActive) warnings.push({ reason: 'restaurant_unavailable' });

  if (changed) {
    if (!kept.length) {
      await cart.deleteOne();
      return { cart: null, warnings };
    }
    cart.items = kept;
    applyTotals(cart, restaurant);
    await cart.save();
  }
  return { cart, warnings };
}

async function getCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !cart.items.length) return emptyCart();
  const synced = await syncCart(cart);
  if (!synced.cart) return { ...emptyCart(), warnings: synced.warnings };
  return present(synced.cart, synced.warnings);
}

async function addItem(userId, { menuItemId, quantity, replaceCart }) {
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) throw ApiError.notFound('Menu item not found');
  if (!menuItem.isAvailable) throw ApiError.conflict('This item is currently unavailable');
  const restaurant = await Restaurant.findById(menuItem.restaurant);
  if (!restaurant || !restaurant.isActive) throw ApiError.conflict('This restaurant is not accepting orders');

  let cart = await Cart.findOne({ user: userId });
  if (cart && cart.items.length && String(cart.restaurant) !== String(menuItem.restaurant)) {
    if (!replaceCart) {
      throw ApiError.conflict(
        'Your cart contains items from another restaurant. Clear the cart or pass replaceCart=true to start a new one'
      );
    }
    cart.items = [];
  }
  if (!cart) cart = new Cart({ user: userId, restaurant: menuItem.restaurant, items: [] });
  cart.restaurant = menuItem.restaurant;

  const existing = cart.items.find((i) => String(i.menuItem) === String(menuItem._id));
  if (existing) {
    if (existing.quantity + quantity > 99) throw ApiError.unprocessable('Quantity per item cannot exceed 99');
    existing.quantity += quantity;
    existing.price = menuItem.finalPrice;
  } else {
    cart.items.push({
      menuItem: menuItem._id, name: menuItem.name, image: menuItem.image, quantity, price: menuItem.finalPrice,
    });
  }
  applyTotals(cart, restaurant);
  await cart.save();
  return present(cart);
}

async function loadCartWithItem(userId, menuItemId) {
  const cart = await Cart.findOne({ user: userId });
  const item = cart?.items.find((i) => String(i.menuItem) === String(menuItemId));
  if (!cart || !item) throw ApiError.notFound('Item not found in cart');
  return { cart, item };
}

async function updateQuantity(userId, menuItemId, quantity) {
  const { cart, item } = await loadCartWithItem(userId, menuItemId);
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem || !menuItem.isAvailable) throw ApiError.conflict('This item is no longer available');
  item.quantity = quantity;
  item.price = menuItem.finalPrice;
  applyTotals(cart, await Restaurant.findById(cart.restaurant));
  await cart.save();
  return present(cart);
}

async function removeItem(userId, menuItemId) {
  const { cart } = await loadCartWithItem(userId, menuItemId);
  cart.items = cart.items.filter((i) => String(i.menuItem) !== String(menuItemId));
  if (!cart.items.length) {
    await cart.deleteOne();
    return emptyCart();
  }
  applyTotals(cart, await Restaurant.findById(cart.restaurant));
  await cart.save();
  return present(cart);
}

async function clearCart(userId) {
  await Cart.deleteOne({ user: userId });
}

module.exports = { getCart, addItem, updateQuantity, removeItem, clearCart, syncCart, applyTotals, round };
