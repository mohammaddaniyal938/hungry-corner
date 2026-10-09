const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signAccessToken } = require('../utils/jwt');
const { ROLES } = require('../utils/constants');

async function register({ name, email, password, phone }) {
  if (await User.exists({ email })) throw ApiError.conflict('An account with this email already exists');
  // Role is never taken from the client; public sign-ups are always customers.
  const user = await User.create({ name, email, password, phone, role: ROLES.CUSTOMER });
  const fresh = await User.findById(user._id).select('+tokenVersion');
  return { user, accessToken: signAccessToken(fresh) };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+password +tokenVersion');
  // Same message for unknown email and wrong password to avoid user enumeration.
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password');
  if (user.isBlocked) throw ApiError.forbidden('Your account has been blocked');
  return { user, accessToken: signAccessToken(user) };
}

// Invalidates every token issued so far for this user.
async function revokeAllTokens(userId) {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password +tokenVersion');
  if (!(await user.comparePassword(currentPassword))) throw ApiError.badRequest('Current password is incorrect');
  if (currentPassword === newPassword) throw ApiError.badRequest('New password must differ from the current password');
  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1; // logs out all other sessions
  await user.save();
  return { accessToken: signAccessToken(user) };
}

module.exports = { register, login, revokeAllTokens, changePassword };
