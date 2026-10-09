const User = require('../models/User');
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/apiResponse');

exports.getMe = asyncHandler(async (req, res) => ok(res, 'Profile fetched successfully', req.user));

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.set(req.body); // body is whitelisted (name, phone) by the validator
  await user.save();
  ok(res, 'Profile updated successfully', user);
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { accessToken } = await authService.changePassword(req.user._id, req.body);
  ok(res, 'Password changed successfully. Other sessions have been signed out', { accessToken });
});
