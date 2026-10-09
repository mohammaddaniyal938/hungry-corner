const mongoose = require('mongoose');
const jsonPlugin = require('../utils/modelPlugin');

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    // Price actually charged (discountPrice when valid, else price). Kept in sync on save
    // so price filtering/sorting can use a plain indexed field.
    finalPrice: { type: Number, min: 0 },
    image: { type: String, trim: true },
    ingredients: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, min: 0, default: 15 }, // minutes
  },
  { timestamps: true }
);

menuItemSchema.pre('validate', function computeFinalPrice(next) {
  if (this.discountPrice != null && this.discountPrice >= this.price) {
    this.invalidate('discountPrice', 'discountPrice must be lower than price', this.discountPrice);
  }
  this.finalPrice = this.discountPrice != null ? this.discountPrice : this.price;
  next();
});

menuItemSchema.index({ restaurant: 1, category: 1, finalPrice: 1 });
menuItemSchema.index({ name: 1 });

jsonPlugin(menuItemSchema);
module.exports = mongoose.model('MenuItem', menuItemSchema);
