const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const { auth } = require('../middleware/auth');

// Get ratings for a movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const ratings = await Rating.find({ movieId: req.params.movieId })
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const avgRating = ratings.length > 0 
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : 0;
    
    res.json({
      ratings,
      averageRating: avgRating,
      totalRatings: ratings.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add or update rating
router.post('/movie/:movieId', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { movieId } = req.params;
    const userId = req.user.id;
    const userName = req.user.firstName && req.user.lastName ? 
      `${req.user.firstName} ${req.user.lastName}` : 
      (req.user.username || req.user.email?.split('@')[0] || 'User');
    const userImage = req.user.imageUrl || null;

    // Update existing or create new rating
    const existingRating = await Rating.findOneAndUpdate(
      { movieId, userId },
      { rating, comment, userName, userImage },
      { new: true, upsert: true }
    );

    res.json(existingRating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's rating for a movie
router.get('/movie/:movieId/user', auth, async (req, res) => {
  try {
    const rating = await Rating.findOne({ 
      movieId: req.params.movieId, 
      userId: req.user.id 
    });
    res.json(rating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;