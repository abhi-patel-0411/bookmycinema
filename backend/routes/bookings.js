const express = require('express');
const { auth, optionalAuth, adminAuth } = require('../middleware/auth');
const { 
  getAllBookings,
  getBookingById,
  createBooking,
  getUserBookings,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
  deletePastShowBookings,
  selectSeats,
  releaseSeats
} = require('../controllers/bookingController');

const router = express.Router();

// Debug route - remove in production
router.get('/debug', async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({}).limit(10);
    res.json({
      count: bookings.length,
      bookings: bookings.map(b => ({
        id: b._id,
        user: b.user,
        userDetails: b.userDetails,
        bookingId: b.bookingId,
        status: b.status
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public/User routes
router.post('/', optionalAuth, createBooking);
router.post('/select-seats', optionalAuth, selectSeats);
router.post('/release-seats', optionalAuth, releaseSeats);
router.get('/my-bookings', auth, getUserBookings);
router.get('/:id', optionalAuth, getBookingById);
router.put('/:id/cancel', optionalAuth, cancelBooking);

// Admin routes (made public for demo)
router.get('/', getAllBookings);
router.put('/:id/status', updateBookingStatus);
router.delete('/:id', deleteBooking);
router.delete('/cleanup/past-shows', deletePastShowBookings);

module.exports = router;