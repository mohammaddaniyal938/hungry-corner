const ApiError = require('../utils/ApiError');

// authorize('admin', 'restaurant_admin') — must run after authenticate().
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Role '${req.user.role}' is not allowed to access this resource`));
  }
  next();
};

module.exports = { authorize };
