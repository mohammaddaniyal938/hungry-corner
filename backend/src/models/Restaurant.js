const mongoose = require('mongoose');
const jsonPlugin = require('../utils/modelPlugin');

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true, index: true },
    image: { type: String, trim: true },
    openingTime: { type: String, match: TIME, default: '09:00' },
    closingTime: { type: String, match: TIME, default: '23:00' },
    isOpen: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    deliveryFee: { type: Number, min: 0, default: 150 },
    minimumOrder: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

restaurantSchema.index({ name: 1 });

jsonPlugin(restaurantSchema);
module.exports = mongoose.model('Restaurant', restaurantSchema);
