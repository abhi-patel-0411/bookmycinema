const express = require('express');
const { adminAuth } = require('../middleware/auth');
const upload = require('../config/multer');
const Show = require('../models/Show');
const { getAllMovies, getMovieById, createMovie, updateMovie, deleteMovie, softDeleteMovie, uploadCastImage } = require('../controllers/movieController');

const router = express.Router();

// Get all movies
router.get('/', getAllMovies);

// Get movie by ID
router.get('/:id', getMovieById);

// Get shows for a movie
router.get('/:id/shows', async (req, res) => {
  try {
    const { date, city } = req.query;
    const query = { movie: req.params.id, isActive: true };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.showDate = { $gte: startDate, $lt: endDate };
    }

    const shows = await Show.find(query)
      .populate('theater', 'name location city')
      .sort({ showDate: 1, showTime: 1 });
    
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add movie (made public for demo)
router.post('/', (req, res, next) => {
  upload.single('poster')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, createMovie);

// Update movie (made public for demo)
router.put('/:id', (req, res, next) => {
  upload.single('poster')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, updateMovie);

// Delete movie permanently (made public for demo)
router.delete('/:id', deleteMovie);

// Soft delete movie (mark as inactive)
router.put('/:id/deactivate', softDeleteMovie);

// Upload cast image
router.post('/upload-cast-image', upload.single('image'), uploadCastImage);

// Test upload endpoint
router.post('/test-upload', upload.single('poster'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.json({ 
      success: true, 
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;