const cartService = require('../services/cart.service');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');

exports.get = asyncHandler(async (req, res) => ok(res, 'Cart fetched successfully', await cartService.getCart(req.user._id)));
exports.addItem = asyncHandler(async (req, res) =>
  created(res, 'Item added to cart', await cartService.addItem(req.user._id, req.body)));
exports.updateItem = asyncHandler(async (req, res) =>
  ok(res, 'Cart item updated', await cartService.updateQuantity(req.user._id, req.params.menuItemId, req.body.quantity)));
exports.removeItem = asyncHandler(async (req, res) =>
  ok(res, 'Item removed from cart', await cartService.removeItem(req.user._id, req.params.menuItemId)));
exports.clear = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user._id);
  ok(res, 'Cart cleared', null);
});
