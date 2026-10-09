const { Joi, objectId, pagination, idParam } = require('./common');
const { ROLES } = require('../utils/constants');

const listUsers = {
  query: Joi.object({
    ...pagination,
    search: Joi.string().trim().max(100),
    role: Joi.string().valid(...Object.values(ROLES)),
    isBlocked: Joi.boolean(),
  }),
};
const userId = { params: idParam('userId') };
const setRole = {
  params: idParam('userId'),
  body: Joi.object({ role: Joi.string().valid(...Object.values(ROLES)).required() }),
};
const listRestaurants = {
  query: Joi.object({
    ...pagination,
    search: Joi.string().trim().max(100),
    city: Joi.string().trim().max(80),
    isActive: Joi.boolean(),
    owner: objectId,
  }),
};

const couponFields = {
  code: Joi.string().trim().uppercase().min(3).max(40),
  discountType: Joi.string().valid('percentage', 'fixed'),
  discountValue: Joi.number().min(0),
  minimumOrder: Joi.number().min(0),
  maximumDiscount: Joi.number().min(0).allow(null),
  expiryDate: Joi.date().iso().greater('now'),
  usageLimit: Joi.number().integer().min(1).allow(null),
  isActive: Joi.boolean(),
  restaurant: objectId.allow(null),
};
const createCoupon = {
  body: Joi.object({
    ...couponFields,
    code: couponFields.code.required(),
    discountType: couponFields.discountType.required(),
    discountValue: couponFields.discountValue.required(),
    expiryDate: couponFields.expiryDate.required(),
  }).custom((v, helpers) =>
    v.discountType === 'percentage' && v.discountValue > 100
      ? helpers.message('percentage discountValue cannot exceed 100')
      : v
  ),
};
const updateCoupon = {
  params: idParam('couponId'),
  body: Joi.object({ ...couponFields, expiryDate: Joi.date().iso() }).min(1),
};
const couponId = { params: idParam('couponId') };

module.exports = { listUsers, userId, setRole, listRestaurants, createCoupon, updateCoupon, couponId };
