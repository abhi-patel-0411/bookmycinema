const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', showController.getAllShows);
router.get('/:id', showController.getShowById);
router.get('/movie/:movieId', showController.getShowsByMovie);
router.get('/theater/:theaterId', showController.getShowsByTheater);
router.get('/date/:date', showController.getShowsByDate);

// Admin routes
router.post('/', verifyToken, isAdmin, showController.createShow);
router.put('/:id', verifyToken, isAdmin, showController.updateShow);
router.delete('/:id', verifyToken, isAdmin, showController.deleteShow);

module.exports = router;