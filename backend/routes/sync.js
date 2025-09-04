const express = require('express');
const mongoose = require('mongoose');
const { emitToUsers } = require('../middleware/realtime');

const router = express.Router();

// Force sync seat status across all environments
router.get('/seats/:showId', async (req, res) => {
  try {
    const { showId } = req.params;
    
    if (!mongoose.models.SeatLock) {
      return res.json({ message: 'SeatLock model not available', locks: [] });
    }
    
    // Clean expired locks
    await mongoose.models.SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });
    
    // Get current locks for this show
    const locks = await mongoose.models.SeatLock.find({ showId });
    
    // Broadcast to all clients
    emitToUsers('seat-status-sync', { 
      showId, 
      locks: locks.map(l => ({ seatId: l.seatId, userId: l.userId }))
    });
    
    res.json({
      message: 'Seat status synced',
      showId,
      lockCount: locks.length,
      locks: locks.map(l => ({ seatId: l.seatId, userId: l.userId }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Force sync all shows
router.get('/seats', async (req, res) => {
  try {
    if (!mongoose.models.SeatLock) {
      return res.json({ message: 'SeatLock model not available', shows: {} });
    }
    
    // Clean expired locks
    const cleanupResult = await mongoose.models.SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });
    
    // Get all active locks
    const allLocks = await mongoose.models.SeatLock.find({});
    
    // Group by show
    const locksByShow = {};
    allLocks.forEach(lock => {
      if (!locksByShow[lock.showId]) locksByShow[lock.showId] = [];
      locksByShow[lock.showId].push({ seatId: lock.seatId, userId: lock.userId });
    });
    
    // Broadcast each show's status
    Object.entries(locksByShow).forEach(([showId, locks]) => {
      emitToUsers('seat-status-sync', { showId, locks });
    });
    
    res.json({
      message: 'All seat statuses synced',
      cleanedExpired: cleanupResult.deletedCount,
      activeShows: Object.keys(locksByShow).length,
      totalLocks: allLocks.length,
      shows: locksByShow
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;