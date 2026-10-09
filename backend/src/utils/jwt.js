const jwt = require('jsonwebtoken');
const env = require('../config/env');

// `tv` (token version) lets us revoke every issued token by bumping user.tokenVersion.
const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id), tv: user.tokenVersion || 0 }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);

module.exports = { signAccessToken, verifyAccessToken };
