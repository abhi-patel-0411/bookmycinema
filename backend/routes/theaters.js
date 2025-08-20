const express = require('express');
const { adminAuth } = require('../middleware/auth');
const { 
  getAllTheaters, 
  getTheaterById, 
  createTheater, 
  updateTheater, 
  deleteTheater,
  addScreen,
  updateScreen,
  deleteScreen,
  getScreen,
  updateSeatLayout,
  getTheatersWithShows,
  getTheaterAnalytics,
  bulkUpdateTheaters,
  getNearbyTheaters
} = require('../controllers/theaterController');

const router = express.Router();

// Public routes
router.get('/', getAllTheaters);
router.get('/with-shows', getTheatersWithShows);
router.get('/nearby', getNearbyTheaters);
router.get('/analytics', getTheaterAnalytics);
router.get('/:id', getTheaterById);

// Admin routes (temporarily remove auth for testing)
router.post('/', createTheater);
router.put('/:id', updateTheater);
router.delete('/:id', deleteTheater);
router.patch('/bulk-update', bulkUpdateTheaters);

// Screen management routes (temporarily remove auth for testing)
router.post('/:id/screens', addScreen);
router.get('/:theaterId/screens/:screenId', getScreen);
router.put('/:theaterId/screens/:screenId', updateScreen);
router.delete('/:theaterId/screens/:screenId', deleteScreen);
router.put('/:theaterId/screens/:screenId/layout', updateSeatLayout);

module.exports = router;