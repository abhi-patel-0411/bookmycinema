const express = require('express');
const router = express.Router();
const Show = require('../models/Show');
const { auth, adminAuth } = require('../middleware/auth');

// Import cleanup controller
const { runFullCleanup } = require('../controllers/cleanupController');

// Cleanup past shows and inactive movies endpoint
router.post('/cleanup', auth, async (req, res) => {
  try {
    const result = await runFullCleanup();
    
    res.json({ 
      success: true, 
      message: `Successfully cleaned up database: ${result.deletedShows} shows deleted, ${result.deactivatedMovies} movies deactivated`,
      deletedShows: result.deletedShows,
      deactivatedMovies: result.deactivatedMovies
    });
  } catch (error) {
    console.error('Error running cleanup:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run cleanup', 
      error: error.message 
    });
  }
});

module.exports = router;