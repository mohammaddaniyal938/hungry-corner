const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const sanitize = require('./middleware/sanitize.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

app.set('trust proxy', 1); // correct client IPs for rate limiting behind a reverse proxy
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients (no Origin header) and configured front-end origins.
      if (!origin || env.clientUrls.includes(origin) || !env.isProd) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitize);
app.use('/api', globalLimiter);

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'OK', data: { uptime: process.uptime() } }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/restaurants', require('./routes/restaurant.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/menu', require('./routes/menu.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
