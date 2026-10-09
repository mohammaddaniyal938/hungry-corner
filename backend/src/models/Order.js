const mongoose = require('mongoose');
const jsonPlugin = require('../utils/modelPlugin');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } = require('../utils/constants');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true }, // snapshot
    price: { type: Number, required: true }, // snapshot of unit price
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    deliveryAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String },
    },
    phone: { type: String, required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cash' },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: 'pending' },
    orderStatus: { type: String, enum: ORDER_STATUS, default: 'pending', index: true },
    statusHistory: {
      type: [
        new mongoose.Schema(
          {
            status: String,
            changedAt: { type: Date, default: Date.now },
            changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.index({ restaurant: 1, orderStatus: 1, createdAt: -1 });
orderSchema.index({ user: 1, createdAt: -1 });

jsonPlugin(orderSchema);
module.exports = mongoose.model('Order', orderSchema);
