const mongoose = require('mongoose');
const jsonPlugin = require('../utils/modelPlugin');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minimumOrder: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, default: null, min: 0 },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null }, // null = valid everywhere
  },
  { timestamps: true }
);

jsonPlugin(couponSchema);
module.exports = mongoose.model('Coupon', couponSchema);
