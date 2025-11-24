const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add a coupon code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, 'Please add a discount value'],
    min: 0
  },
  minimumAmount: {
    type: Number,
    min: 0
  },
  maximumDiscount: {
    type: Number,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    min: 0
  },
  usedCount: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Check if coupon is valid
couponSchema.methods.isValid = function() {
  const now = new Date();
  return this.active && 
         this.startDate <= now && 
         this.endDate >= now &&
         (this.usageLimit === undefined || this.usedCount < this.usageLimit);
};

module.exports = mongoose.model('Coupon', couponSchema);
