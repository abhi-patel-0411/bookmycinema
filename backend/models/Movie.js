const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  genre: [{ type: String }],
  duration: { type: Number, required: false },
  language: { type: String, required: false },
  releaseDate: { type: Date, required: false },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  poster: { type: String, required: false },
  youtubeUrl: { type: String },
  director: { type: String },
  price: { type: Number, default: 199 },

  isActive: { type: Boolean, default: true },



  reviews: [reviewSchema],
  totalRatings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },



  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Movie", movieSchema);
