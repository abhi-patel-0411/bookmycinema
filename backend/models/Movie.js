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
  description: { type: String, required: true },
  genre: [{ type: String, required: true }],
  duration: { type: Number, required: true },
  language: { type: String, required: true },
  releaseDate: { type: Date, required: true },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  poster: { type: String, required: true },
  trailer: { type: String },
  youtubeUrl: { type: String },
  cast: [
    {
      name: { type: String, required: true },
      image: { type: String },
      role: { type: String },
    },
  ],
  director: { type: String },
  price: { type: Number, default: 199 },
  youtubeTrailer: { type: String },
  isActive: { type: Boolean, default: true },

  // TMDB Integration
  tmdbId: { type: Number, unique: true, sparse: true },
  backdrop: { type: String },
  voteAverage: { type: Number, default: 0 },
  voteCount: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },

  // Enhanced fields
  reviews: [reviewSchema],
  totalRatings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  country: { type: String, default: "India" },
  budget: { type: String },
  boxOffice: { type: String },

  // Showing period fields
  startDate: { type: Date },
  endDate: { type: Date },
  isUpcoming: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Movie", movieSchema);
