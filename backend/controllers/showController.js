const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const { emitToUsers } = require('../middleware/realtime');

// Helper function to check if show booking should be closed (15 min before start)
const isBookingClosed = (showDate, showTime) => {
  const now = new Date();
  const showDateTime = new Date(showDate);
  const [hours, minutes] = showTime.split(':');
  showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  
  // Close booking 15 minutes before show starts
  const bookingCloseTime = new Date(showDateTime.getTime() - 15 * 60 * 1000);
  return now >= bookingCloseTime;
};

// Helper function to check if show has passed
const isShowPast = (showDate, showTime) => {
  const now = new Date();
  const showDateTime = new Date(showDate);
  const [hours, minutes] = showTime.split(':');
  showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return now > showDateTime;
};

// Delete shows for expired movies
const deleteShowsForExpiredMovies = async () => {
  try {
    // Find all inactive movies
    const Movie = require('../models/Movie');
    const inactiveMovies = await Movie.find({ isActive: false }).select('_id');
    const inactiveMovieIds = inactiveMovies.map(movie => movie._id);
    
    if (inactiveMovieIds.length > 0) {
      console.log(`Found ${inactiveMovieIds.length} inactive movies, deleting their shows`);
      const result = await Show.deleteMany({ movie: { $in: inactiveMovieIds } });
      console.log(`Deleted ${result.deletedCount} shows for inactive movies`);
      return result.deletedCount;
    }
    return 0;
  } catch (error) {
    console.error('Error deleting shows for expired movies:', error);
    return 0;
  }
};

// Cleanup past shows automatically
const cleanupPastShows = async () => {
  try {
    // Get all shows and check if they have passed
    const allShows = await Show.find({});
    const now = new Date();
    let deletedCount = 0;
    
    for (const show of allShows) {
      const showDateTime = new Date(show.showDate);
      const [hours, minutes] = show.showTime.split(':');
      showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      
      // If show has passed, delete it
      if (now > showDateTime) {
        await Show.findByIdAndDelete(show._id);
        deletedCount++;
        console.log(`Deleted past show: ${show.movie} on ${show.showDate} at ${show.showTime}`);
      }
    }
    
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} past shows from database`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up past shows:', error);
    return 0;
  }
};

// Get all shows
const getAllShows = async (req, res) => {
  try {
    const { current, includeBookingClosed, admin } = req.query;
    
    let query = {};
    
    console.log('Getting all shows, admin:', admin);
    
    // If current=true, only return shows that haven't started yet
    if (current === 'true') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query.showDate = { $gte: today };
    }
    
    let shows = await Show.find(query)
      .populate('movie')
      .populate('theater')
      .sort({ showDate: 1, showTime: 1 });
    
    // For user side (not admin), filter out past shows
    if (admin !== 'true') {
      shows = shows.filter(show => {
        const now = new Date();
        const showDateTime = new Date(show.showDate);
        const [hours, minutes] = show.showTime.split(':');
        showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        
        // Hide past shows for users
        return now <= showDateTime;
      });
    }
    
    // Filter out shows where booking is closed or show has started
    if (includeBookingClosed !== 'true' && admin !== 'true') {
      shows = shows.filter(show => {
        const now = new Date();
        const showDateTime = new Date(show.showDate);
        const [hours, minutes] = show.showTime.split(':');
        showDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        
        // Hide shows 15 minutes before start time
        const bookingCloseTime = new Date(showDateTime.getTime() - 15 * 60 * 1000);
        return now < bookingCloseTime;
      });
    }
    
    // Add booking status to each show
    shows = shows.map(show => ({
      ...show.toObject(),
      bookingClosed: isBookingClosed(show.showDate, show.showTime),
      isPast: isShowPast(show.showDate, show.showTime)
    }));
    
    console.log('Found shows:', shows.length);
    res.json(shows);
  } catch (error) {
    console.error('Error in getAllShows:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get show by ID
const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie')
      .populate('theater');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    res.json(show);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shows by movie
const getShowsByMovie = async (req, res) => {
  try {
    console.log('Getting shows for movie:', req.params.movieId);
    
    // Don't delete shows automatically when fetching
    // await cleanupPastShows();
    
    // Get date from query params if provided
    const { date } = req.query;
    const query = { movie: req.params.movieId };
    
    // Add date filter if provided
    if (date) {
      // Parse the date string in YYYY-MM-DD format
      const [year, month, day] = date.split('-').map(num => parseInt(num, 10));
      
      // Create date objects for start and end of the day in UTC
      const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      
      console.log('Date filter:', {
        date,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dateOnly: startDate.toISOString().split('T')[0]
      });
      
      // Use $gte and $lte for date range query
      query.showDate = { $gte: startDate, $lte: endDate };
    }
    
    console.log('Show query:', query);
    
    let shows = await Show.find(query)
      .populate({
        path: 'movie',
        select: 'title poster duration genre'
      })
      .populate({
        path: 'theater',
        select: 'name location city address screens amenities facilities'
      })
      .sort({ showDate: 1, showTime: 1 });
    
    console.log('Raw shows found:', shows.length);
    
    // Filter out shows with missing theater data
    shows = shows.filter(show => show.theater && show.theater._id);
    console.log('Shows with valid theater data:', shows.length);
    
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
    
    // Add booking status to each show
    shows = shows.map(show => {
      // Make sure theater data is properly included
      const theaterData = show.theater ? {
        _id: show.theater._id,
        name: show.theater.name || 'Unknown Theater',
        location: show.theater.location || show.theater.address?.street || '',
        city: show.theater.city || show.theater.address?.city || '',
        screens: show.theater.screens || [],
        amenities: show.theater.amenities || show.theater.facilities || []
      } : null;
      
      return {
        ...show.toObject(),
        theater: theaterData,
        bookingClosed: isBookingClosed(show.showDate, show.showTime),
        isPast: isShowPast(show.showDate, show.showTime)
      };
    });
    
    console.log('Final shows after filtering:', shows.length);
    res.json(shows);
  } catch (error) {
    console.error('Error getting shows by movie:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get shows by theater
const getShowsByTheater = async (req, res) => {
  try {
    // Cleanup past shows and shows for expired movies
    await cleanupPastShows();
    await deleteShowsForExpiredMovies();
    
    const shows = await Show.find({ theater: req.params.theaterId })
      .populate('movie')
      .populate('theater')
      .sort({ showDate: 1, showTime: 1 });
    
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shows by date
const getShowsByDate = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    const shows = await Show.find({
      showDate: {
        $gte: date,
        $lt: nextDay
      }
    })
      .populate('movie')
      .populate('theater')
      .sort({ showTime: 1 });
    
    res.json(shows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create show
const createShow = async (req, res) => {
  try {
    console.log('Creating show with data:', req.body);
    
    // Validate movie and theater exist
    const movie = await Movie.findById(req.body.movie);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const theater = await Theater.findById(req.body.theater);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    
    console.log('Theater found:', theater.name);
    
    // Find the screen in the theater
    const screenNumber = parseInt(req.body.screenNumber) || 1;
    let availableSeats = 100; // Default capacity
    
    if (theater.screens && theater.screens.length > 0) {
      const screen = theater.screens.find(s => s.screenNumber === screenNumber);
      if (screen) {
        availableSeats = screen.capacity || 100;
        console.log(`Using screen ${screenNumber} with capacity ${availableSeats}`);
      } else {
        console.log(`Screen ${screenNumber} not found, using default capacity of ${availableSeats}`);
      }
    } else {
      console.log(`No screens found for theater ${theater.name}, using default capacity of ${availableSeats}`);
    }
    
    // Format the date properly
    let showDate;
    try {
      const dateInput = req.body.date || req.body.showDate;
      console.log('Raw date input:', dateInput);
      
      // Parse the date string
      showDate = new Date(dateInput);
      
      if (isNaN(showDate.getTime())) {
        throw new Error('Invalid date');
      }
      
      // Ensure we're storing the date at midnight in UTC
      const dateString = showDate.toISOString().split('T')[0];
      showDate = new Date(dateString + 'T00:00:00.000Z');
      
      console.log('Parsed show date:', {
        original: dateInput,
        parsed: showDate,
        isoString: showDate.toISOString(),
        dateOnly: dateString
      });
    } catch (dateError) {
      console.error('Invalid date format:', req.body.date || req.body.showDate, dateError);
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Validate show time format
    const showTime = req.body.time || req.body.showTime;
    if (!showTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(showTime)) {
      console.error('Invalid time format:', showTime);
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM format (24-hour)' });
    }
    
    // Ensure price is a number
    const basePrice = parseInt(req.body.price) || 150;
    console.log('Base price:', basePrice);
    
    const pricing = req.body.pricing || {
      silver: parseInt(req.body.silverPrice) || basePrice,
      gold: parseInt(req.body.goldPrice) || Math.round(basePrice * 1.3),
      premium: parseInt(req.body.premiumPrice) || Math.round(basePrice * 1.8)
    };
    
    console.log('Pricing:', pricing);
    
    const show = new Show({
      movie: req.body.movie,
      theater: req.body.theater,
      showDate: showDate,
      showTime: showTime,
      screenNumber: screenNumber,
      price: basePrice,
      pricing: pricing,
      availableSeats: availableSeats,
      bookedSeats: [],
      isActive: true
    });
    
    const savedShow = await show.save();
    console.log('Show created:', savedShow._id);
    
    const populatedShow = await Show.findById(savedShow._id)
      .populate('movie')
      .populate('theater');
    
    if (!populatedShow.theater) {
      console.error('Theater not populated in saved show');
    } else {
      console.log('Theater populated successfully:', populatedShow.theater.name);
    }
    
    emitToUsers('show-added', populatedShow);
    res.status(201).json(populatedShow);
  } catch (error) {
    console.error('Error creating show:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update show
const updateShow = async (req, res) => {
  try {
    console.log('Updating show:', req.params.id, 'with data:', req.body);
    
    const show = await Show.findById(req.params.id);
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Map the fields correctly
    if (req.body.date || req.body.showDate) show.showDate = req.body.date || req.body.showDate;
    if (req.body.time || req.body.showTime) show.showTime = req.body.time || req.body.showTime;
    if (req.body.movie) show.movie = req.body.movie;
    if (req.body.theater) show.theater = req.body.theater;
    if (req.body.price) show.price = req.body.price;
    if (req.body.screenNumber) show.screenNumber = req.body.screenNumber;
    if (req.body.isActive !== undefined) show.isActive = req.body.isActive;
    
    // Update pricing if provided
    if (req.body.pricing || req.body.silverPrice || req.body.goldPrice || req.body.premiumPrice) {
      const basePrice = req.body.price || show.price;
      show.pricing = {
        silver: req.body.silverPrice || req.body.pricing?.silver || basePrice,
        gold: req.body.goldPrice || req.body.pricing?.gold || Math.round(basePrice * 1.3),
        premium: req.body.premiumPrice || req.body.pricing?.premium || Math.round(basePrice * 1.8)
      };
    }
    
    const updatedShow = await show.save();
    console.log('Show updated:', updatedShow._id);
    
    const populatedShow = await Show.findById(updatedShow._id)
      .populate('movie')
      .populate('theater');
    
    emitToUsers('show-updated', populatedShow);
    res.json(populatedShow);
  } catch (error) {
    console.error('Error updating show:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete show
const deleteShow = async (req, res) => {
  try {
    console.log('Deleting show:', req.params.id);
    
    const show = await Show.findById(req.params.id);
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if show has any active bookings
    const Booking = require('../models/Booking');
    const activeBookings = await Booking.countDocuments({ 
      show: req.params.id, 
      status: { $in: ['confirmed', 'pending'] }
    });
    
    const { force } = req.query;
    
    if (activeBookings > 0 && force !== 'true') {
      return res.status(400).json({ 
        message: `Cannot delete show with ${activeBookings} active booking(s). Cancel bookings first or use force delete.`,
        bookingCount: activeBookings,
        canForceDelete: true
      });
    }
    
    // If force delete or no active bookings, cancel all bookings and delete
    if (activeBookings > 0) {
      await Booking.updateMany(
        { show: req.params.id },
        { status: 'cancelled' }
      );
      console.log(`Force deleted show with ${activeBookings} bookings - all bookings cancelled`);
    }
    
    await Show.findByIdAndDelete(req.params.id);
    console.log('Show deleted:', req.params.id);
    
    emitToUsers('show-deleted', { id: req.params.id });
    res.json({ 
      message: activeBookings > 0 
        ? `Show deleted and ${activeBookings} booking(s) cancelled` 
        : 'Show deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting show:', error);
    res.status(500).json({ message: error.message });
  }
};

// Deactivate expired movies based on endDate
const deactivateExpiredMovies = async () => {
  try {
    const now = new Date();
    const expiredMovies = await Movie.find({
      isActive: true,
      endDate: { $lt: now }
    });
    
    let deactivatedCount = 0;
    for (const movie of expiredMovies) {
      await Movie.findByIdAndUpdate(movie._id, { isActive: false });
      await Show.deleteMany({ movie: movie._id });
      deactivatedCount++;
      console.log(`Deactivated expired movie: ${movie.title}`);
    }
    
    return deactivatedCount;
  } catch (error) {
    console.error('Error deactivating expired movies:', error);
    return 0;
  }
};

// Auto cleanup scheduler - runs every minute
const startAutoCleanup = () => {
  console.log('Starting automatic cleanup of past shows and expired movies...');
  
  const runCleanup = async () => {
    const pastShowsCount = await cleanupPastShows();
    const expiredMoviesCount = await deactivateExpiredMovies();
    const expiredMoviesShowsCount = await deleteShowsForExpiredMovies();
    const totalCount = pastShowsCount + expiredMoviesShowsCount;
    
    if (totalCount > 0 || expiredMoviesCount > 0) {
      console.log(`Cleanup: Removed ${totalCount} shows (${pastShowsCount} past, ${expiredMoviesShowsCount} from expired movies), deactivated ${expiredMoviesCount} expired movies`);
    }
  };
  
  // Run initial cleanup
  runCleanup();
  
  // Then run every minute
  setInterval(runCleanup, 60 * 1000);
};

// Force delete show (for admin use)
const forceDeleteShow = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Cancel all bookings for this show
    const Booking = require('../models/Booking');
    const cancelledBookings = await Booking.updateMany(
      { show: req.params.id },
      { status: 'cancelled' }
    );
    
    await Show.findByIdAndDelete(req.params.id);
    
    emitToUsers('show-deleted', { id: req.params.id });
    res.json({ 
      message: `Show force deleted and ${cancelledBookings.modifiedCount} booking(s) cancelled`
    });
  } catch (error) {
    console.error('Error force deleting show:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllShows,
  getShowById,
  getShowsByMovie,
  getShowsByTheater,
  getShowsByDate,
  createShow,
  updateShow,
  deleteShow,
  forceDeleteShow,
  cleanupPastShows,
  deleteShowsForExpiredMovies,
  deactivateExpiredMovies,
  isBookingClosed,
  isShowPast,
  startAutoCleanup
};