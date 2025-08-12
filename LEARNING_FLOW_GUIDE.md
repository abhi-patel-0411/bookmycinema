# BookMyCinema - Complete Learning Flow Guide

## 🎯 Learning Path: From Beginner to Expert

### 📚 Phase 1: Understanding the Foundation (Start Here)

#### 1. **Project Structure Overview** (5 minutes)
**File to read first:** `README.md`
```
📁 bookmycinema/
├── backend/     ← Server-side code (Node.js + Express)
├── frontend/    ← Client-side code (React.js)
└── docs/        ← Documentation
```

#### 2. **Package Dependencies** (10 minutes)
**Files to examine:**
- `backend/package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies

**What you'll learn:**
- What libraries the project uses
- Scripts available to run
- Project metadata

---

### 📚 Phase 2: Backend Deep Dive (Start with Server)

#### Step 1: **Main Server File** (20 minutes)
**File:** `backend/server.js`
**Line-by-line breakdown:**

```javascript
// Lines 1-7: Import required modules
const express = require("express");        // Web framework
const mongoose = require("mongoose");      // MongoDB connection
const cors = require("cors");             // Cross-origin requests
const dotenv = require("dotenv");         // Environment variables
const path = require("path");             // File path utilities
const http = require("http");             // HTTP server
const { initializeSocket } = require("./middleware/realtime"); // WebSocket

// Lines 9-12: Initialize app and server
dotenv.config();                          // Load .env file
const app = express();                    // Create Express app
const server = http.createServer(app);    // Create HTTP server
const io = initializeSocket(server);      // Initialize Socket.io

// Lines 14-25: CORS configuration
const allowedOrigins = [                  // Allowed frontend URLs
  "http://localhost:3000",               // Local development
  process.env.FRONTEND_URL,              // Production URL
  // ... more origins
];

// Lines 27-32: Middleware setup
app.use(cors({ origin: allowedOrigins })); // Enable CORS
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded

// Lines 40-52: API Routes mounting
app.use("/api/auth", require("./routes/auth"));         // Authentication
app.use("/api/users", require("./routes/users"));       // User management
app.use("/api/movies", require("./routes/movies"));     // Movie operations
app.use("/api/theaters", require("./routes/theaters")); // Theater management
app.use("/api/shows", require("./routes/shows"));       // Show scheduling
app.use("/api/bookings", require("./routes/bookings")); // Booking system
app.use("/api/payment", require("./routes/payment"));   // Payment processing

// Lines 70-85: Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    // Start background services
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Lines 120-125: Start server
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

**Key Concepts Learned:**
- Express.js server setup
- Middleware configuration
- Route mounting
- Database connection
- Socket.io integration

#### Step 2: **Database Models** (30 minutes)
**Learning Order:**

**A. User Model** - `backend/models/User.js`
```javascript
// Basic user structure
{
  clerkId: String,     // External auth ID
  email: String,       // User email
  role: String,        // 'user' or 'admin'
  profile: Object      // Additional user data
}
```

**B. Movie Model** - `backend/models/Movie.js`
```javascript
// Movie information
{
  title: String,       // Movie name
  description: String, // Plot summary
  genre: [String],     // Categories
  duration: Number,    // Runtime in minutes
  poster: String,      // Image URL
  isActive: Boolean,   // Currently showing
  startDate: Date,     // Release date
  endDate: Date,       // Last showing date
  reviews: [Object]    // User reviews
}
```

**C. Theater Model** - `backend/models/Theater.js`
```javascript
// Theater and screen information
{
  name: String,        // Theater name
  location: String,    // Address
  screens: [{          // Multiple screens
    screenNumber: Number,
    capacity: Number,
    seatLayout: [Object] // Seat arrangement
  }],
  amenities: [String], // Facilities
  isActive: Boolean
}
```

**D. Show Model** - `backend/models/Show.js`
```javascript
// Movie showings
{
  movie: ObjectId,     // Reference to Movie
  theater: ObjectId,   // Reference to Theater
  screen: ObjectId,    // Which screen
  date: Date,          // Show date
  time: String,        // Show time
  price: Number,       // Ticket price
  availableSeats: [String], // Available seats
  bookedSeats: [String]     // Booked seats
}
```

**E. Booking Model** - `backend/models/Booking.js`
```javascript
// User bookings
{
  user: String,        // User ID
  show: ObjectId,      // Reference to Show
  seats: [String],     // Booked seat numbers
  totalAmount: Number, // Total cost
  bookingId: String,   // Unique booking ID
  ticketId: String,    // Unique ticket ID
  status: String       // 'confirmed' or 'cancelled'
}
```

#### Step 3: **Controllers (Business Logic)** (45 minutes)
**Learning Order:**

**A. Movie Controller** - `backend/controllers/movieController.js`
```javascript
// Key functions:
getAllMovies()    // GET /api/movies - Fetch all movies
getMovieById()    // GET /api/movies/:id - Get specific movie
createMovie()     // POST /api/movies - Add new movie (Admin)
updateMovie()     // PUT /api/movies/:id - Update movie (Admin)
deleteMovie()     // DELETE /api/movies/:id - Remove movie (Admin)
```

**B. Theater Controller** - `backend/controllers/theaterController.js`
```javascript
// Key functions:
getAllTheaters()  // GET /api/theaters - Fetch all theaters
getTheaterById()  // GET /api/theaters/:id - Get specific theater
createTheater()   // POST /api/theaters - Add theater (Admin)
addScreen()       // POST /api/theaters/:id/screens - Add screen
```

**C. Show Controller** - `backend/controllers/showController.js`
```javascript
// Key functions:
getAllShows()     // GET /api/shows - All shows
getShowsByMovie() // GET /api/shows/movie/:id - Shows for movie
createShow()      // POST /api/shows - Create show (Admin)
startAutoCleanup() // Background task to remove expired shows
```

**D. Booking Controller** - `backend/controllers/bookingController.js` (Current file)
```javascript
// Key functions:
createBooking()   // POST /api/bookings - Create new booking
getUserBookings() // GET /api/bookings - User's bookings
cancelBooking()   // DELETE /api/bookings/:id - Cancel booking
getAllBookings()  // GET /api/bookings/all - All bookings (Admin)

// Advanced features:
lockSeats()       // Temporary seat reservation
unlockSeats()     // Release seat locks
cleanExpiredLocks() // Remove expired reservations
```

#### Step 4: **Routes (API Endpoints)** (30 minutes)
**Learning Order:**

**A. Movie Routes** - `backend/routes/movies.js`
```javascript
router.get('/', getAllMovies);           // List movies
router.get('/:id', getMovieById);        // Movie details
router.post('/', auth, admin, createMovie); // Add movie (Admin only)
```

**B. Booking Routes** - `backend/routes/bookings.js`
```javascript
router.post('/', auth, createBooking);   // Create booking (Auth required)
router.get('/', auth, getUserBookings);  // User bookings (Auth required)
```

#### Step 5: **Middleware** (20 minutes)
**A. Authentication** - `backend/middleware/auth.js`
```javascript
// Verify JWT tokens
// Check user permissions
// Admin role validation
```

**B. Real-time** - `backend/middleware/realtime.js`
```javascript
// Socket.io configuration
// Real-time seat updates
// Live notifications
```

---

### 📚 Phase 3: Frontend Deep Dive

#### Step 1: **Main App Component** (25 minutes)
**File:** `frontend/src/App.js`

```javascript
// Lines 1-20: Imports
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

// Lines 25-45: Route Protection
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" />;
  return children;
};

// Lines 50-100: Route Configuration
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/movies" element={<Movies />} />
  <Route path="/booking/:showId" element={<BookingPage />} />
  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
</Routes>
```

#### Step 2: **Context Providers** (20 minutes)
**A. Auth Context** - `frontend/src/contexts/AuthContext.js`
```javascript
// User authentication state
// Login/logout functions
// User profile management
```

**B. Socket Context** - `frontend/src/contexts/SocketContext.js`
```javascript
// Real-time connection
// Seat booking updates
// Live notifications
```

#### Step 3: **Key Pages** (60 minutes)
**Learning Order:**

**A. Home Page** - `frontend/src/pages/Home.js`
```javascript
// Movie carousels
// Featured content
// Search functionality
```

**B. Movies Page** - `frontend/src/pages/Movies.js`
```javascript
// Movie listing
// Search and filters
// Movie cards
```

**C. Movie Details** - `frontend/src/pages/MovieDetails.js`
```javascript
// Detailed movie info
// Cast and crew
// Show times
```

**D. Booking Page** - `frontend/src/pages/BookingPage.js`
```javascript
// Seat selection interface
// Real-time seat updates
// Booking confirmation
```

**E. Payment Page** - `frontend/src/pages/PaymentPage.js`
```javascript
// Stripe integration
// Payment processing
// Success handling
```

#### Step 4: **API Services** (30 minutes)
**A. Base API** - `frontend/src/services/api.js`
```javascript
// Axios configuration
// Base URL setup
// Request/response interceptors
```

**B. Movies API** - `frontend/src/services/api/moviesAPI.js`
```javascript
export const moviesAPI = {
  getAll: () => api.get('/movies'),
  getById: (id) => api.get(`/movies/${id}`),
  create: (data) => api.post('/movies', data),
  update: (id, data) => api.put(`/movies/${id}`, data)
};
```

---

### 📚 Phase 4: Understanding Data Flow

#### Complete User Journey Flow:

**1. User Visits Homepage**
```
Frontend: Home.js → API call → Backend: movieController.getAllMovies() → Database: Movie.find()
```

**2. User Selects Movie**
```
Frontend: MovieDetails.js → API call → Backend: movieController.getMovieById() → Database: Movie.findById()
```

**3. User Views Showtimes**
```
Frontend: ShowTimes.js → API call → Backend: showController.getShowsByMovie() → Database: Show.find()
```

**4. User Books Seats**
```
Frontend: BookingPage.js → Socket.io → Backend: Seat locking → Real-time updates
```

**5. User Makes Payment**
```
Frontend: PaymentPage.js → Stripe API → Backend: Payment webhook → Database: Booking.create()
```

**6. Booking Confirmation**
```
Backend: Email service → Frontend: Confirmation page → Database: Booking update
```

---

### 📚 Phase 5: Advanced Features

#### Real-time Seat Booking (Current File Analysis)
**File:** `backend/controllers/bookingController.js`

**Key Concepts:**
```javascript
// Lines 85-95: Seat Locking System
const seatLocks = new Map(); // In-memory seat locks

// Lines 97-115: Clean Expired Locks
const cleanExpiredLocks = (showId) => {
  // Remove locks older than timeout
  // Different timeouts for different lock types
};

// Lines 117-160: Lock Seats Function
const lockSeats = (showId, seats, userId, lockType) => {
  // Check for conflicts
  // Lock seats temporarily
  // Set auto-release timeout
};

// Lines 200-250: Create Booking Function
const createBooking = async (req, res) => {
  // Validate show exists
  // Check seat availability
  // Lock seats
  // Create booking record
  // Update show availability
  // Send confirmation email
};
```

---

### 🎯 Recommended Learning Sequence

#### Week 1: Backend Fundamentals
1. **Day 1-2:** `server.js` + `package.json`
2. **Day 3-4:** All models (`models/*.js`)
3. **Day 5-6:** Movie controller + routes
4. **Day 7:** Theater controller + routes

#### Week 2: Backend Advanced
1. **Day 1-2:** Show controller + booking controller
2. **Day 3-4:** Authentication + middleware
3. **Day 5-6:** Real-time features + Socket.io
4. **Day 7:** Payment integration

#### Week 3: Frontend Basics
1. **Day 1-2:** `App.js` + routing
2. **Day 3-4:** Context providers
3. **Day 5-6:** Home page + movie pages
4. **Day 7:** API services

#### Week 4: Frontend Advanced
1. **Day 1-2:** Booking system
2. **Day 3-4:** Payment integration
3. **Day 5-6:** Admin dashboard
4. **Day 7:** Real-time features

#### Week 5: Integration & Testing
1. **Day 1-2:** End-to-end flow testing
2. **Day 3-4:** Database operations
3. **Day 5-6:** Deployment setup
4. **Day 7:** Performance optimization

---

### 🔧 Hands-on Learning Tips

#### 1. **Start the Project**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm start
```

#### 2. **Add Console Logs**
```javascript
// Add these to understand flow
console.log("📍 Function called:", functionName);
console.log("📊 Data received:", data);
console.log("✅ Operation completed");
```

#### 3. **Use Browser DevTools**
- Network tab: See API calls
- Console: View logs and errors
- Application tab: Check localStorage/cookies

#### 4. **Database Exploration**
```javascript
// Add to any controller to see database state
const allMovies = await Movie.find();
console.log("🎬 All movies:", allMovies);
```

---

### 🎯 Key Learning Checkpoints

After each phase, you should be able to answer:

**Phase 1:** What is the overall project structure?
**Phase 2:** How does the backend handle requests?
**Phase 3:** How does the frontend display data?
**Phase 4:** How do frontend and backend communicate?
**Phase 5:** How do advanced features work?

---

**Start with `backend/server.js` and follow this guide step by step. Each file builds upon the previous knowledge!**