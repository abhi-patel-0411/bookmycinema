const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { initializeSocket } = require("./middleware/realtime");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL,
  "https://your-movie-booking-app.vercel.app",
  "https://movie-booking-app.vercel.app",
  /\.vercel\.app$/,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// Static file serving removed - using base64/URL images for cloud deployment

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Database connection check middleware
app.use('/api', (req, res, next) => {
  // Skip DB check for health and test endpoints
  if (req.path === '/health' || req.path === '/test') {
    return next();
  }
  
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: "Database temporarily unavailable. Please try again.",
      type: "network_error",
      retry: true
    });
  }
  next();
});

// Health check route that works even without DB
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: "ok",
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Test route with database check
app.get("/api/test", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    if (dbStatus === 'disconnected') {
      return res.status(503).json({
        message: "Database temporarily unavailable",
        database: dbStatus,
        timestamp: new Date().toISOString(),
        type: "network_error"
      });
    }
    
    const SeatLock = mongoose.models.SeatLock;
    const lockCount = SeatLock ? await SeatLock.countDocuments() : 0;
    
    res.json({
      message: "Backend is working!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
      seatLocks: lockCount,
      version: '2.0'
    });
  } catch (error) {
    res.status(503).json({
      message: "Database connection error",
      error: error.message,
      timestamp: new Date().toISOString(),
      type: "network_error"
    });
  }
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth-sync", require("./routes/auth-sync")); // Add auth-sync route
app.use("/api/clerk-sync", require("./routes/clerkSync")); // Add clerk-sync route
app.use("/api/users", require("./routes/users"));
app.use("/api/movies", require("./routes/movies"));
app.use("/api/theaters", require("./routes/theaters"));
app.use("/api/shows", require("./routes/shows"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/reviews", require("./routes/reviews"));

app.use("/api/ratings", require("./routes/ratings"));
app.use("/api/webhooks", require("./routes/webhooks"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/sync", require("./routes/sync"));

// Inngest endpoint (disabled for now)
// app.use('/', require('./routes/inngestEndpoint'));

// app.use("/api/test", require("./routes/test"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  
  // Handle MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      message: "Database connection lost. Please try again.",
      type: "network_error",
      retry: true
    });
  }
  
  res.status(500).json({ 
    message: "Internal server error", 
    error: err.message,
    type: "server_error"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// MongoDB Connection with retry logic
const connectWithRetry = () => {
  mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5
    })
  .then(async () => {
    console.log("✅ MongoDB connected successfully");
    console.log("📊 Database:", mongoose.connection.name);

    const UserSyncService = require("./services/userSyncService");

    // Function to schedule periodic user sync
    function scheduleUserSync(intervalMinutes = 60) {
      console.log(`🔄 Scheduling user sync every ${intervalMinutes} minutes`);
      setInterval(async () => {
        try {
          console.log("🔄 Running scheduled user sync...");
          const syncResult = await UserSyncService.syncAllUsers();
          console.log(
            `👥 Scheduled sync completed: ${syncResult.newUsers} new users, ${syncResult.updatedUsers} updated users`
          );
        } catch (error) {
          console.error("❌ Error in scheduled user sync:", error.message);
        }
      }, intervalMinutes * 60 * 1000);
    }

    // Sync users from Clerk on startup
    try {
      const syncResult = await UserSyncService.syncAllUsers();
      console.log(
        `👥 User sync completed: ${syncResult.newUsers} new users, ${syncResult.updatedUsers} updated users`
      );
    } catch (error) {
      console.error("❌ Error syncing users:", error.message);
    }

    // Start auto cleanup for expired shows
    const { startAutoCleanup } = require("./controllers/showController");
    const { runFullCleanup } = require("./controllers/cleanupController");
    const { updateComingSoonMovies } = require("./controllers/movieController");

    // Run full cleanup on startup
    try {
      const result = await runFullCleanup();
      console.log(
        `🧹 Initial cleanup: ${result.deletedShows} shows deleted, ${result.deactivatedMovies} movies deactivated`
      );
    } catch (error) {
      console.error("❌ Error in initial cleanup:", error.message);
    }

    // Start auto cleanup scheduler
    startAutoCleanup();
    console.log("🧹 Auto cleanup scheduler started");

    // Start user sync scheduler (sync every 5 minutes for dynamic cleanup)
    scheduleUserSync(5);
    
    // Run immediate cleanup on startup
    console.log('🧹 Running initial user cleanup...');
    try {
      const cleanupResult = await UserSyncService.syncAllUsers();
      console.log(`🧹 Initial cleanup: +${cleanupResult.newUsers} new, ~${cleanupResult.updatedUsers} updated, -${cleanupResult.deletedUsers} deleted`);
    } catch (error) {
      console.error('❌ Error in initial user cleanup:', error.message);
    }
    
    // Update coming soon movies on startup
    try {
      await updateComingSoonMovies();
      console.log('✅ Coming soon movies updated on startup');
    } catch (error) {
      console.error('❌ Error updating coming soon movies:', error.message);
    }
    
    // Schedule frequent coming soon updates (every minute)
    setInterval(async () => {
      try {
        await updateComingSoonMovies();
      } catch (error) {
        console.error('❌ Error in scheduled coming soon update:', error.message);
      }
    }, 60000); // 1 minute
    console.log('🎬 Coming soon auto-update scheduler started (runs every minute)');
    
    // Start seat lock cleanup
    const { startLockCleanup } = require('./cleanup-locks');
    startLockCleanup();
    
    // Start periodic seat status broadcast for cross-environment sync
    setInterval(async () => {
      try {
        const mongoose = require('mongoose');
        if (mongoose.models.SeatLock) {
          await mongoose.models.SeatLock.deleteMany({ expiresAt: { $lt: new Date() } });
          const activeLocks = await mongoose.models.SeatLock.find({});
          
          // Group locks by show
          const locksByShow = {};
          activeLocks.forEach(lock => {
            if (!locksByShow[lock.showId]) locksByShow[lock.showId] = [];
            locksByShow[lock.showId].push({ seatId: lock.seatId, userId: lock.userId });
          });
          
          // Broadcast current seat status to all connected clients
          Object.entries(locksByShow).forEach(([showId, locks]) => {
            const { emitToUsers } = require('./middleware/realtime');
            emitToUsers('seat-status-sync', { showId, locks });
          });
        }
      } catch (error) {
        console.error('❌ Seat sync error:', error.message);
      }
    }, 2000); // Every 2 seconds
    console.log('🔄 Started cross-environment seat sync (every 2s)');
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  });
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectWithRetry, 5000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err.message);
    process.exit(1);
  }
});

// Start initial connection
connectWithRetry();

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`🧪 Test URL: http://localhost:${PORT}/api/test`);
});
