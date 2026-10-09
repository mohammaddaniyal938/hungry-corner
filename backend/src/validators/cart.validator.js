const { Joi, objectId, idParam } = require('./common');

const quantity = Joi.number().integer().min(1).max(99);

const addItem = {
  body: Joi.object({
    menuItemId: objectId.required(),
    quantity: quantity.required(),
    // When the cart holds another restaurant's items, replaceCart=true clears it first.
    replaceCart: Joi.boolean().default(false),
  }),
};
const updateItem = { params: idParam('menuItemId'), body: Joi.object({ quantity: quantity.required() }) };
const removeItem = { params: idParam('menuItemId') };

module.exports = { addItem, updateItem, removeItem };
