const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const jsonPlugin = require('../utils/modelPlugin');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    isBlocked: { type: Boolean, default: false },
    // Bumped on logout / password change to invalidate all previously issued JWTs.
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hash(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

jsonPlugin(userSchema, ['password', 'tokenVersion']);
module.exports = mongoose.model('User', userSchema);
