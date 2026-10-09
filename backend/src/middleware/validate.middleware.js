const ApiError = require('../utils/ApiError');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// validate({ body, query, params }) with Joi schemas. Validated values replace the originals
// (defaults applied, unknown keys stripped, types coerced).
const validate = (schemas) => (req, _res, next) => {
  for (const source of ['params', 'query', 'body']) {
    const schema = schemas[source];
    if (!schema) continue;
    const { value, error } = schema.validate(req[source] || {}, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const errors = error.details.map((d) => ({ field: d.path.join('.'), message: d.message.replace(/"/g, "'") }));
      return next(ApiError.unprocessable('Validation failed', errors));
    }
    // Express 4 allows reassigning req.query/params.
    req[source] = value;
  }
  next();
};

// validateId('restaurantId', 'categoryId') — 400 for malformed MongoDB ids.
const validateId = (...names) => (req, _res, next) => {
  for (const name of names) {
    if (!OBJECT_ID.test(String(req.params[name] || ''))) {
      return next(ApiError.badRequest(`Invalid ${name}`));
    }
  }
  next();
};

module.exports = { validate, validateId, OBJECT_ID };
