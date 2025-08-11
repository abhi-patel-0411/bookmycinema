const express = require('express');
const router = express.Router();

// GET /api/reviews - Get all reviews
router.get('/', async (req, res) => {
  try {
    res.json({ message: 'Reviews endpoint working', reviews: [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/reviews - Create a new review
router.post('/', async (req, res) => {
  try {
    res.json({ message: 'Review created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;