const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  movie: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Movie', 
    required: true 
  },
  theater: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Theater', 
    required: true 
  },
  showDate: { 
    type: Date, 
    required: true 
  },
  showTime: { 
    type: String, 
    required: true 
  },
  screenNumber: {
    type: Number,
    required: true
  },
  price: { 
    type: Number, 
    required: true 
  },
  pricing: {
    silver: { type: Number, required: true },
    gold: { type: Number, default: function() { return Math.round(this.pricing.silver * 1.3); } },
    premium: { type: Number, default: function() { return Math.round(this.pricing.silver * 1.8); } }
  },
  availableSeats: { 
    type: Number, 
    required: true 
  },
  bookedSeats: [{ 
    type: String 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Virtual for formatted date
showSchema.virtual('formattedDate').get(function() {
  return this.showDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted time
showSchema.virtual('formattedTime').get(function() {
  return new Date(`2000-01-01T${this.showTime}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

// Virtual to check if show is past current time
showSchema.virtual('isPast').get(function() {
  const now = new Date();
  const showDateTime = new Date(this.showDate);
  const [hours, minutes] = this.showTime.split(':');
  showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return now > showDateTime;
});

// Pre-save middleware to sync base price with silver price
showSchema.pre('save', function(next) {
  if (this.pricing && this.pricing.silver) {
    this.price = this.pricing.silver;
  }
  next();
});

// Pre-update middleware to sync base price with silver price
showSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  if (update.pricing && update.pricing.silver) {
    update.price = update.pricing.silver;
  } else if (update['pricing.silver']) {
    update.price = update['pricing.silver'];
  }
  next();
});

module.exports = mongoose.model('Show', showSchema);