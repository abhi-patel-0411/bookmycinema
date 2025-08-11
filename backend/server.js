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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
  });
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

// Inngest endpoint (disabled for now)
// app.use('/', require('./routes/inngestEndpoint'));

// app.use("/api/test", require("./routes/test"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
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

    // Start user sync scheduler (sync every 30 minutes)
    scheduleUserSync(1);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
  console.log(`🧪 Test URL: http://localhost:${PORT}/api/test`);
});
