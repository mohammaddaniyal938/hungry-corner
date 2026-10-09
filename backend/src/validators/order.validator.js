const { Joi, objectId, phone, pagination, idParam } = require('./common');
const { ORDER_STATUS, PAYMENT_METHODS } = require('../utils/constants');

const create = {
  body: Joi.object({
    deliveryAddress: Joi.object({
      address: Joi.string().trim().min(5).max(300).required(),
      city: Joi.string().trim().min(2).max(80).required(),
      postalCode: Joi.string().trim().max(12).allow(''),
    }).required(),
    phone: phone.required(),
    paymentMethod: Joi.string().valid(...PAYMENT_METHODS).default('cash'),
    notes: Joi.string().trim().allow('').max(500),
    couponCode: Joi.string().trim().uppercase().max(40),
  }),
};

const dateRange = {
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
};

const myOrders = {
  query: Joi.object({ ...pagination, status: Joi.string().valid(...ORDER_STATUS) }),
};
const cancel = {
  params: idParam('orderId'),
  body: Joi.object({ reason: Joi.string().trim().max(300) }),
};
const updateStatus = {
  params: idParam('orderId'),
  body: Joi.object({ status: Joi.string().valid(...ORDER_STATUS).required() }),
};
const restaurantOrders = {
  params: idParam('restaurantId'),
  query: Joi.object({
    ...pagination,
    ...dateRange,
    status: Joi.string().valid(...ORDER_STATUS),
    search: Joi.string().trim().max(40),
  }),
};
const adminOrders = {
  query: Joi.object({
    ...pagination,
    ...dateRange,
    status: Joi.string().valid(...ORDER_STATUS),
    search: Joi.string().trim().max(40),
    restaurant: objectId,
    user: objectId,
  }),
};

module.exports = { create, myOrders, cancel, updateStatus, restaurantOrders, adminOrders };
