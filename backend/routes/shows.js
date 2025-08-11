const express = require('express');
const { adminAuth } = require('../middleware/auth');
const { 
  getAllShows, 
  getShowById, 
  getShowsByMovie,
  getShowsByTheater,
  getShowsByDate,
  createShow, 
  updateShow, 
  deleteShow,
  forceDeleteShow,
  cleanupPastShows
} = require('../controllers/showController');
const Show = require('../models/Show');
const Theater = require('../models/Theater');

const router = express.Router();

// Public routes
router.get('/', getAllShows);

// Get cities with shows
router.get('/cities', async (req, res) => {
  try {
    const shows = await Show.find({ isActive: { $ne: false } })
      .populate('theater')
      .select('theater');
    
    const cities = new Set();
    
    shows.forEach(show => {
      if (show.theater) {
        const city = show.theater.city || show.theater.location || show.theater.address?.city;
        if (city && city.trim()) {
          cities.add(city.trim());
        }
      }
    });
    
    const cityList = Array.from(cities).sort();
    console.log('Available cities:', cityList);
    res.json(cityList);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get shows by movie
router.get('/movie/:movieId', async (req, res) => {
  try {
    const { date, city } = req.query;
    const movieId = req.params.movieId;
    
    if (!movieId || movieId === 'undefined') {
      return res.status(400).json({ message: 'Invalid movie ID' });
    }
    
    const query = { movie: movieId, isActive: { $ne: false } };
    
    console.log('Fetching shows for movie:', movieId, 'with filters:', { date, city });
    
    if (date) {
      try {
        // Parse the date string into a Date object - use UTC to avoid timezone issues
        const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
        
        // Create date objects with the exact date (no timezone offset)
        const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
        
        if (isNaN(startDate.getTime())) {
          console.error('Invalid date format:', date);
          return res.status(400).json({ message: 'Invalid date format' });
        }
        
        // Log the date range we're searching for
        console.log('Searching for shows between:', startDate, 'and', endDate);
        console.log('Date string format:', startDate.toISOString().split('T')[0]);
        
        // Use $gte and $lte for date range query
        query.showDate = { $gte: startDate, $lte: endDate };
        
        // Also log the query object
        console.log('MongoDB query:', JSON.stringify(query));
      } catch (dateError) {
        console.error('Error parsing date:', date, dateError);
        return res.status(400).json({ message: 'Invalid date format' });
      }
    }

    console.log('Final query:', query);
    
    let shows = await Show.find(query)
      .populate({
        path: 'theater',
        select: 'name location city address screens amenities facilities'
      })
      .populate('movie', 'title poster duration genre')
      .sort({ showDate: 1, showTime: 1 });

    console.log('Found shows before city filter:', shows.length);

    // Filter by city if provided and not empty
    if (city && city.trim() !== '') {
      shows = shows.filter(show => {
        if (!show.theater) return false;
        
        const theaterCity = show.theater.city || 
                           show.theater.location || 
                           (show.theater.address && show.theater.address.city) || 
                           '';
                           
        const match = theaterCity.toLowerCase().includes(city.toLowerCase());
        console.log('City filter:', theaterCity, 'matches', city, ':', match);
        return match;
      });
    }
    
    // Make sure all shows have properly populated theater data
    shows = shows.filter(show => show.theater && show.theater._id);
    
    // Filter out shows where booking is closed (15 min before show)
    shows = shows.filter(show => {
      const now = new Date();
      const showDateTime = new Date(show.showDate);
      const [hours, minutes] = show.showTime.split(':');
      showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      // Close booking 15 minutes before show starts
      const bookingCloseTime = new Date(showDateTime.getTime() - 15 * 60 * 1000);
      return now < bookingCloseTime;
    });
    
    // Add theater name and location if missing
    shows = shows.map(show => {
      if (show.theater && !show.theater.name) {
        show.theater.name = 'Theater';
      }
      if (show.theater && !show.theater.location && !show.theater.city) {
        show.theater.city = city || 'Unknown';
      }
      return show;
    });
    
    console.log('Final shows after filtering:', shows.length);
    res.json(shows);
  } catch (error) {
    console.error('Error fetching shows by movie:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get shows by theater
router.get('/theater/:theaterId', getShowsByTheater);

// Get shows by date
router.get('/date/:date', getShowsByDate);

// Search shows
router.get('/search', async (req, res) => {
  try {
    const { movie, theater, city, date, time } = req.query;
    const query = { isActive: true };
    
    if (movie) {
      query['movie.title'] = new RegExp(movie, 'i');
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.showDate = { $gte: startDate, $lt: endDate };
    }
    
    if (time) {
      query.showTime = new RegExp(time, 'i');
    }
    
    const shows = await Show.find(query)
      .populate('theater')
      .populate('movie', 'title poster duration genre')
      .sort({ showDate: 1, showTime: 1 });
    
    // Filter by city and theater name if provided
    let filteredShows = shows;
    
    if (city) {
      filteredShows = filteredShows.filter(show => {
        const theaterCity = show.theater?.address?.city || show.theater?.city || '';
        return theaterCity.toLowerCase().includes(city.toLowerCase());
      });
    }
    
    if (theater) {
      filteredShows = filteredShows.filter(show => 
        show.theater?.name?.toLowerCase().includes(theater.toLowerCase())
      );
    }
    
    res.json(filteredShows);
  } catch (error) {
    console.error('Error searching shows:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get specific show by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching show by ID:', req.params.id);
    
    const show = await Show.findById(req.params.id)
      .populate({
        path: 'theater',
        select: 'name location city address screens'
      })
      .populate('movie', 'title poster duration genre description');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    console.log('Show found with theater:', show.theater?.name);
    console.log('Theater screens:', show.theater?.screens?.length || 0);
    
    res.json(show);
  } catch (error) {
    console.error('Error fetching show:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin routes (made public for demo)
router.post('/', createShow);
router.put('/:id', updateShow);
router.delete('/:id', deleteShow);
router.delete('/:id/force', forceDeleteShow);

// Cleanup past shows
router.post('/cleanup', async (req, res) => {
  try {
    const deletedCount = await cleanupPastShows();
    res.json({ 
      success: true, 
      message: `Successfully removed ${deletedCount} past shows`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up past shows:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clean up past shows', 
      error: error.message 
    });
  }
});

module.exports = router;