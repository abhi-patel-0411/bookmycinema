const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Can be ObjectId or Clerk ID
  userDetails: {
    clerkId: String,
    email: String
  },
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  // Store movie and theater details directly in case the movie gets deactivated
  movieTitle: { type: String },
  moviePoster: { type: String },
  movieRating: { type: String },
  theaterName: { type: String },
  screenNumber: { type: Number },
  screenName: { type: String },
  showDate: { type: Date },
  showTime: { type: String },
  seats: [{ type: String, required: true }],
  totalAmount: { type: Number, required: true },
  bookingDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  bookingId: { type: String, unique: true, required: true },
  ticketId: { type: String, unique: true, required: true },
  cancelledAt: { type: Date },
  refundAmount: { type: Number }
});

// Pre-save hook to generate bookingId and ticketId if not provided
bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    this.bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  if (!this.ticketId) {
    this.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);