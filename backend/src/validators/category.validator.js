const { Joi, url, idParam } = require('./common');

const fields = {
  name: Joi.string().trim().min(1).max(80),
  description: Joi.string().trim().allow('').max(500),
  image: url,
  sortOrder: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
};

const create = {
  params: idParam('restaurantId'),
  body: Joi.object({ ...fields, name: fields.name.required() }),
};
const update = { params: idParam('categoryId'), body: Joi.object(fields).min(1) };
const list = {
  params: idParam('restaurantId'),
  query: Joi.object({ isActive: Joi.string().valid('true', 'false', 'all') }),
};

module.exports = { create, update, list };
