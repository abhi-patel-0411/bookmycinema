const Show = require('../models/Show');
const Movie = require('../models/Movie');
const { deleteShowsForExpiredMovies } = require('./showController');

// Run a full cleanup of shows and movies
const runFullCleanup = async () => {
  try {
    console.log('Running full cleanup of shows and movies...');
    
    // Step 1: Delete shows for expired movies
    const deletedShowsCount = await deleteShowsForExpiredMovies();
    
    // Step 2: Check for any remaining shows for expired movies
    const inactiveMovies = await Movie.find({ isActive: false }).select('_id');
    const inactiveMovieIds = inactiveMovies.map(movie => movie._id);
    
    if (inactiveMovieIds.length > 0) {
      // Double-check for any remaining shows
      const remainingShows = await Show.find({ movie: { $in: inactiveMovieIds } });
      
      if (remainingShows.length > 0) {
        console.log(`Found ${remainingShows.length} remaining shows for inactive movies, deleting them...`);
        const result = await Show.deleteMany({ movie: { $in: inactiveMovieIds } });
        console.log(`Deleted ${result.deletedCount} remaining shows for inactive movies`);
      }
    }
    
    return {
      deletedShows: deletedShowsCount,
      deactivatedMovies: inactiveMovieIds.length
    };
  } catch (error) {
    console.error('Error running full cleanup:', error);
    return {
      deletedShows: 0,
      deactivatedMovies: 0,
      error: error.message
    };
  }
};

module.exports = {
  runFullCleanup
};