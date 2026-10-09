const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');

async function resolveUser(req, { required }) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    if (required) throw ApiError.unauthorized('Missing or malformed Authorization header');
    return null;
  }
  const token = header.slice(7).trim();
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized('Token has expired');
    throw ApiError.unauthorized('Invalid token');
  }
  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if ((user.tokenVersion || 0) !== (payload.tv || 0)) {
    throw ApiError.unauthorized('Session is no longer valid. Please log in again');
  }
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked');
  return user;
}

// Requires a valid JWT; attaches the user to req.user.
const authenticate = asyncHandler(async (req, _res, next) => {
  req.user = await resolveUser(req, { required: true });
  next();
});

// Attaches req.user when a valid token is present; never fails when it is absent.
// (An invalid/expired token is still rejected so clients notice stale sessions.)
const optionalAuthenticate = asyncHandler(async (req, _res, next) => {
  req.user = await resolveUser(req, { required: false });
  next();
});

module.exports = { authenticate, optionalAuthenticate };
