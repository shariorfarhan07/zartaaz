const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  source: {
    type: String,
    enum: ['homepage', 'footer', 'admin', 'other'],
    default: 'homepage'
  },
  preferences: {
    weeklyUpdates: {
      type: Boolean,
      default: true
    },
    saleAlerts: {
      type: Boolean,
      default: true
    },
    newArrivals: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Index for email lookup
newsletterSchema.index({ email: 1 });
newsletterSchema.index({ isActive: 1 });

module.exports = mongoose.model('Newsletter', newsletterSchema);

