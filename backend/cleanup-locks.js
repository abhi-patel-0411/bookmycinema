// Periodic cleanup for seat locks
const mongoose = require('mongoose');

const cleanupExpiredLocks = async () => {
  try {
    if (!mongoose.models.SeatLock) return;
    
    const result = await mongoose.models.SeatLock.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} expired seat locks`);
    }
  } catch (error) {
    console.error('❌ Lock cleanup error:', error.message);
  }
};

// Run cleanup every 30 seconds
const startLockCleanup = () => {
  setInterval(cleanupExpiredLocks, 30000);
  console.log('🧹 Started seat lock cleanup scheduler');
};

module.exports = { startLockCleanup, cleanupExpiredLocks };