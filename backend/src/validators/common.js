const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const phone = Joi.string().pattern(/^\+?[0-9]{10,15}$/).messages({
  'string.pattern.base': 'phone must be 10-15 digits, optionally starting with +',
});
const password = Joi.string()
  .min(8)
  .max(72) // bcrypt only uses the first 72 bytes
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[0-9]/, 'digit')
  .messages({ 'string.pattern.name': 'password must contain at least one {#name} character' });
const time = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).messages({
  'string.pattern.base': 'must be in HH:mm (24h) format',
});
const url = Joi.string().uri({ scheme: ['http', 'https'] }).max(2048);

// Accepts an array or a comma separated string (multipart forms send strings).
const stringList = Joi.alternatives().try(
  Joi.array().items(Joi.string().trim().max(80)).max(50),
  Joi.string().custom((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
);

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
};

const idParam = (name) => Joi.object({ [name]: objectId.required() });

module.exports = { Joi, objectId, phone, password, time, url, stringList, pagination, idParam };
