const { Joi, objectId, url, stringList, pagination, idParam } = require('./common');

const fields = {
  category: objectId,
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().allow('').max(2000),
  price: Joi.number().min(0),
  discountPrice: Joi.number().min(0).allow(null),
  image: url,
  ingredients: stringList,
  isAvailable: Joi.boolean(),
  preparationTime: Joi.number().integer().min(0).max(600),
};

const create = {
  params: idParam('restaurantId'),
  body: Joi.object({
    ...fields,
    category: fields.category.required(),
    name: fields.name.required(),
    price: fields.price.required(),
  }),
};
const update = { params: idParam('menuItemId'), body: Joi.object(fields).min(1) };
const availability = {
  params: idParam('menuItemId'),
  body: Joi.object({ isAvailable: Joi.boolean().required() }),
};
const list = {
  params: idParam('restaurantId'),
  query: Joi.object({
    ...pagination,
    category: objectId,
    search: Joi.string().trim().max(100),
    minPrice: Joi.number().min(0),
    maxPrice: Joi.number().min(0),
    available: Joi.boolean(),
    sort: Joi.string().valid('newest', 'price_asc', 'price_desc', 'name'),
  }),
};

module.exports = { create, update, availability, list };
