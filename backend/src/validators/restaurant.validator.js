const { Joi, objectId, phone, time, url, pagination, idParam } = require('./common');

const base = {
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().allow('').max(2000),
  phone,
  email: Joi.string().trim().lowercase().email(),
  address: Joi.string().trim().min(3).max(300),
  city: Joi.string().trim().min(2).max(80),
  image: url,
  openingTime: time,
  closingTime: time,
  isOpen: Joi.boolean(),
  deliveryFee: Joi.number().min(0),
  minimumOrder: Joi.number().min(0),
};

const create = {
  body: Joi.object({
    ...base,
    name: base.name.required(),
    address: base.address.required(),
    city: base.city.required(),
    owner: objectId, // honoured for super admins only
  }),
};

// isActive/owner are accepted here and stripped in the controller for non-super-admins.
const update = {
  params: idParam('restaurantId'),
  body: Joi.object({ ...base, isActive: Joi.boolean(), owner: objectId }).min(1),
};

const list = {
  query: Joi.object({
    ...pagination,
    search: Joi.string().trim().max(100),
    city: Joi.string().trim().max(80),
    isOpen: Joi.boolean(),
    isActive: Joi.string().valid('true', 'false', 'all'),
    sort: Joi.string().valid('newest', 'name'),
  }),
};

const setStatus = {
  params: idParam('restaurantId'),
  body: Joi.object({ isActive: Joi.boolean().required() }),
};

module.exports = { create, update, list, setStatus };
