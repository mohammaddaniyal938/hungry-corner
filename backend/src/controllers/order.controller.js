const orderService = require('../services/order.service');
const access = require('../services/access.service');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildPagination } = require('../utils/pagination');
const { created, ok } = require('../utils/apiResponse');

exports.create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user, req.body);
  created(res, 'Order placed successfully', order);
});

exports.myOrders = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query);
  const filter = orderService.buildFilter({ status: req.query.status, user: req.user._id });
  const { orders, total } = await orderService.paginate(filter, pg);
  ok(res, 'Orders fetched successfully', orders, buildPagination(pg, total));
});

exports.get = asyncHandler(async (req, res) =>
  ok(res, 'Order fetched successfully', await orderService.getOrderForUser(req.user, req.params.orderId)));

exports.cancel = asyncHandler(async (req, res) =>
  ok(res, 'Order cancelled successfully', await orderService.cancelOrder(req.user, req.params.orderId, req.body.reason)));

exports.updateStatus = asyncHandler(async (req, res) =>
  ok(res, 'Order status updated successfully', await orderService.updateStatus(req.user, req.params.orderId, req.body.status)));

exports.restaurantOrders = asyncHandler(async (req, res) => {
  const restaurant = await access.getManagedRestaurant(req.user, req.params.restaurantId);
  const pg = getPagination(req.query);
  const filter = orderService.buildFilter({ ...req.query, restaurant: restaurant._id });
  const { orders, total } = await orderService.paginate(filter, pg);
  ok(res, 'Restaurant orders fetched successfully', orders, buildPagination(pg, total));
});
