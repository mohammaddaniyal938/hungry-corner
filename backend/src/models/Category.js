const mongoose = require('mongoose');
const jsonPlugin = require('../utils/modelPlugin');

const categorySchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    nameKey: { type: String, select: false }, // lower-cased name; backs the case-insensitive unique index
    description: { type: String, trim: true, maxlength: 500, default: '' },
    image: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function setNameKey(next) {
  if (this.name) this.nameKey = this.name.trim().toLowerCase();
  next();
});

// Category names are unique per restaurant, case-insensitively.
categorySchema.index({ restaurant: 1, nameKey: 1 }, { unique: true });

jsonPlugin(categorySchema, ['nameKey']);
module.exports = mongoose.model('Category', categorySchema);
