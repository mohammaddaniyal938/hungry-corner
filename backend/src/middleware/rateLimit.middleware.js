const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const make = (opts) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, res) =>
      res.status(429).json({ success: false, message: 'Too many requests, please try again later', errors: [] }),
    ...opts,
  });

// Brute-force protection for register/login.
const authLimiter = make({ windowMs: 15 * 60 * 1000, max: 20 });
const globalLimiter = make({ windowMs: 15 * 60 * 1000, max: 600 });

module.exports = { authLimiter, globalLimiter };
