const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { created, ok } = require('../utils/apiResponse');

exports.register = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.register(req.body);
  created(res, 'Registration successful', { user, accessToken });
});

exports.login = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.login(req.body);
  ok(res, 'Login successful', { user, accessToken });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.revokeAllTokens(req.user._id);
  ok(res, 'Logged out successfully', null);
});
