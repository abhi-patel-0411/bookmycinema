const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

// Get dashboard data
router.get('/', adminAuth, async (req, res) => {
  try {
    // Get current date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get counts
    const [movies, theaters, bookings, users] = await Promise.all([
      Movie.find(),
      Theater.find(),
      Booking.find(),
      User.find()
    ]);
    
    // Calculate booking stats
    const todayBookings = bookings.filter(b => new Date(b.bookingDate) >= today);
    const yesterdayBookings = bookings.filter(b => {
      const date = new Date(b.bookingDate);
      return date >= yesterday && date < today;
    });
    const weekBookings = bookings.filter(b => new Date(b.bookingDate) >= lastWeek);
    
    // Calculate revenue
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    // Calculate booking status
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    
    // Calculate growth rates
    const bookingGrowth = yesterdayBookings.length > 0 
      ? ((todayBookings.length - yesterdayBookings.length) / yesterdayBookings.length) * 100
      : todayBookings.length > 0 ? 100 : 0;
    
    const revenueGrowth = weekRevenue > 0 && todayRevenue > 0 
      ? ((todayRevenue - (weekRevenue / 7)) / (weekRevenue / 7)) * 100
      : 0;
    
    // Generate chart data for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });
    
    const dailyBookings = last7Days.map(date => {
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate.toDateString() === date.toDateString();
      });
      return dayBookings.length;
    });
    
    const dailyRevenue = last7Days.map(date => {
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        return bookingDate.toDateString() === date.toDateString();
      });
      return dayBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    });
    
    // Prepare response
    const stats = {
      totalUsers: users.length,
      totalMovies: movies.length,
      activeMovies: movies.filter(m => m.status !== 'inactive').length,
      totalTheaters: theaters.length,
      activeTheaters: theaters.filter(t => t.status !== 'inactive').length,
      totalBookings: bookings.length,
      todayBookings: todayBookings.length,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      totalRevenue: Math.round(totalRevenue),
      todayRevenue: Math.round(todayRevenue),
      weekRevenue: Math.round(weekRevenue),
      avgBookingValue: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
      bookingGrowth: Math.round(bookingGrowth * 10) / 10,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      conversionRate: bookings.length > 0 ? Math.round((confirmedBookings / bookings.length) * 100) : 0,
      chartData: {
        labels: last7Days.map(date => date.toLocaleDateString('en-US', { weekday: 'short' })),
        bookings: dailyBookings,
        revenue: dailyRevenue
      }
    };
    
    // Get recent movies
    const recentMovies = await Movie.find().sort({ createdAt: -1 }).limit(3);
    
    // Generate alerts
    const alerts = [];
    if (todayBookings.length === 0) alerts.push({ type: 'warning', message: 'No bookings today yet' });
    if (pendingBookings > 5) alerts.push({ type: 'info', message: `${pendingBookings} bookings need confirmation` });
    if (movies.length < 3) alerts.push({ type: 'info', message: 'Add more movies to increase bookings' });
    if (stats.conversionRate < 70) alerts.push({ type: 'warning', message: 'Low booking confirmation rate' });
    if (stats.totalRevenue > 10000) alerts.push({ type: 'success', message: 'Great revenue performance!' });
    
    res.json({
      stats,
      recentMovies,
      alerts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;