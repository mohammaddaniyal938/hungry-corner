const env = require('./config/env');
const app = require('./app');
const { connectDB } = require('./config/database');

async function start() {
  await connectDB();
  console.log('MongoDB connected');
  const server = app.listen(env.port, () => console.log(`API listening on port ${env.port} (${env.nodeEnv})`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
