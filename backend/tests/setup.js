process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret'; // deterministic, independent of any local .env
const mongoose = require('mongoose');
const request = require('supertest');

let mongod;

// Use TEST_MONGODB_URI if provided (e.g. a local mongod), otherwise spin up an in-memory MongoDB.
async function connect() {
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
    uri = mongod.getUri();
  }
  await mongoose.connect(uri, { dbName: `rest_test_${process.pid}_${Date.now()}` });
}

async function disconnect() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

const app = () => require('../src/app');
const api = () => request(app());

async function register(overrides = {}) {
  const body = {
    name: 'Test User', email: `u${Date.now()}${Math.random().toString(36).slice(2, 7)}@example.com`,
    password: 'Password123!', phone: '+923001234567', ...overrides,
  };
  const res = await api().post('/api/auth/register').send(body);
  return { body, res, token: res.body.data?.accessToken, user: res.body.data?.user };
}

// Creates a user with an elevated role directly in the DB, then logs in through the API.
async function createStaff(role, name = role) {
  const User = require('../src/models/User');
  const email = `${role}${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`;
  await User.create({ name, email, password: 'Password123!', role, phone: '+923001234567' });
  const res = await api().post('/api/auth/login').send({ email, password: 'Password123!' });
  return { token: res.body.data.accessToken, user: res.body.data.user };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { connect, disconnect, api, register, createStaff, auth };
