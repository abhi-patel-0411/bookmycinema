const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userImage: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure one rating per user per movie
ratingSchema.index({ movieId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);