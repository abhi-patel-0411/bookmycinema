# Routes Documentation - BookMyCinema Backend

## Table of Contents
1. [Overview](#overview)
2. [Route Architecture](#route-architecture)
3. [Individual Route Files](#individual-route-files)
4. [Middleware Integration](#middleware-integration)
5. [Request Flow](#request-flow)
6. [Authentication & Authorization](#authentication--authorization)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Overview

Routes in the BookMyCinema backend define API endpoints, handle HTTP methods, apply middleware, and connect to controllers. Each route file manages endpoints for a specific domain.

### Route Files:
- `bookings.js` - Booking and seat management endpoints
- `movies.js` - Movie catalog and show listings
- `theaters.js` - Theater and screen management
- `shows.js` - Show scheduling endpoints
- `users.js` - User management and authentication
- `auth.js` - Authentication endpoints
- `admin.js` - Admin dashboard endpoints
- `payment.js` - Payment processing
- `webhooks.js` - External service webhooks

---

## Route Architecture

### Standard Route Pattern
```javascript
const express = require('express');
const { auth, adminAuth } = require('../middleware/auth');
const { controllerFunction } = require('../controllers/controller');

const router = express.Router();

// Route definition
router.method('/path', middleware, controllerFunction);

module.exports = router;
```

### HTTP Methods Used
- `GET` - Retrieve data
- `POST` - Create new resources
- `PUT` - Update entire resources
- `PATCH` - Partial updates
- `DELETE` - Remove resources

---

## Individual Route Files

### 1. bookings.js - Booking Management Routes

**Purpose**: Handles all booking-related operations including seat selection, booking creation, and management

#### Route Structure Analysis:

```javascript
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
```

**Import Analysis**:
- `express`: Creates router instance
- `auth middleware`: Authentication functions
- `controller functions`: Business logic handlers

#### Debug Route:
```javascript
router.get('/debug', async (req, res) => {
  // Direct database query for debugging
  // Returns booking statistics
  // Should be removed in production
});
```
**Purpose**: Development debugging endpoint
**Security**: No authentication (development only)
**Response**: Booking count and sample data

#### Public/User Routes:
```javascript
router.post('/', optionalAuth, createBooking);
```
**Endpoint**: `POST /api/bookings`
**Middleware**: `optionalAuth` - allows both authenticated and guest users
**Purpose**: Create new booking
**Flow**: 
1. Extract user info (if authenticated)
2. Validate show and seat availability
3. Lock seats temporarily
4. Create booking record
5. Update show availability
6. Send confirmation

```javascript
router.post('/select-seats', optionalAuth, selectSeats);
```
**Endpoint**: `POST /api/bookings/select-seats`
**Purpose**: Temporarily lock seats during selection
**Flow**:
1. Check seat availability
2. Apply in-memory locks
3. Set auto-release timer (60 seconds)
4. Emit real-time updates

```javascript
router.post('/release-seats', optionalAuth, releaseSeats);
```
**Endpoint**: `POST /api/bookings/release-seats`
**Purpose**: Release seat locks manually
**Flow**:
1. Find user's locked seats
2. Remove locks from memory
3. Emit availability updates

```javascript
router.get('/my-bookings', auth, getUserBookings);
```
**Endpoint**: `GET /api/bookings/my-bookings`
**Middleware**: `auth` - requires authentication
**Purpose**: Get user's booking history
**Flow**:
1. Extract user ID from token
2. Query bookings by user
3. Populate movie/theater data
4. Return booking list

```javascript
router.get('/:id', optionalAuth, getBookingById);
```
**Endpoint**: `GET /api/bookings/:id`
**Purpose**: Get specific booking details
**Flow**:
1. Find booking by ID
2. Check ownership (if authenticated)
3. Populate related data
4. Return booking details

```javascript
router.put('/:id/cancel', optionalAuth, cancelBooking);
```
**Endpoint**: `PUT /api/bookings/:id/cancel`
**Purpose**: Cancel existing booking
**Flow**:
1. Validate booking ownership
2. Check if show is in future
3. Free up seats
4. Update booking status
5. Process refund (if applicable)

#### Admin Routes:
```javascript
router.get('/', getAllBookings);
```
**Endpoint**: `GET /api/bookings`
**Purpose**: Get all bookings with filtering
**Security**: Made public for demo (should be admin-only)
**Flow**:
1. Apply search/filter parameters
2. Implement pagination
3. Populate related data
4. Return booking list with metadata

```javascript
router.put('/:id/status', updateBookingStatus);
```
**Endpoint**: `PUT /api/bookings/:id/status`
**Purpose**: Update booking status (admin only)
**Flow**:
1. Find booking by ID
2. Update status field
3. Emit real-time updates
4. Return updated booking

```javascript
router.delete('/:id', deleteBooking);
```
**Endpoint**: `DELETE /api/bookings/:id`
**Purpose**: Delete booking record
**Flow**:
1. Find booking
2. Free up seats (if future show)
3. Delete from database
4. Emit deletion event

```javascript
router.delete('/cleanup/past-shows', deletePastShowBookings);
```
**Endpoint**: `DELETE /api/bookings/cleanup/past-shows`
**Purpose**: Bulk delete old booking records
**Flow**:
1. Find bookings older than specified days
2. Filter for past shows only
3. Bulk delete matching records
4. Return cleanup statistics

### 2. movies.js - Movie Management Routes

**Purpose**: Manages movie catalog, file uploads, and show listings

#### Key Routes Analysis:

```javascript
router.get('/', getAllMovies);
```
**Endpoint**: `GET /api/movies`
**Purpose**: Get all movies with filtering
**Query Parameters**: `search`, `genre`, `language`, `isActive`
**Flow**:
1. Build filter query
2. Apply search conditions
3. Sort by relevance
4. Return movie list

```javascript
router.get('/:id', getMovieById);
```
**Endpoint**: `GET /api/movies/:id`
**Purpose**: Get specific movie details
**Flow**:
1. Find movie by ID
2. Check if active
3. Return movie data

```javascript
router.get('/:id/shows', async (req, res) => {
  // Custom route handler for movie shows
});
```
**Endpoint**: `GET /api/movies/:id/shows`
**Purpose**: Get shows for specific movie
**Query Parameters**: `date`, `city`
**Flow**:
1. Find shows for movie ID
2. Filter by date range
3. Populate theater data
4. Filter by city (post-population)
5. Sort by date/time
6. Return show list

#### File Upload Routes:
```javascript
router.post('/', (req, res, next) => {
  upload.any()(req, res, (err) => {
    // Multer middleware for file handling
    // Organizes files by fieldname
    // Handles poster and cast images
  });
}, createMovie);
```
**Endpoint**: `POST /api/movies`
**Middleware**: Custom multer handler
**Purpose**: Create movie with file uploads
**File Handling**:
1. Process multiple file types
2. Organize by field name
3. Handle poster separately
4. Store cast images
5. Pass to controller

#### Utility Routes:
```javascript
router.post('/update-coming-soon', async (req, res) => {
  // Updates movie upcoming status based on dates
});
```
**Purpose**: Batch update movie status
**Flow**:
1. Find movies with start dates
2. Compare with current date
3. Update `isUpcoming` flag
4. Return update statistics

```javascript
router.post('/test-upload', upload.single('poster'), (req, res) => {
  // Test file upload functionality
});
```
**Purpose**: Development testing endpoint
**Flow**:
1. Accept single file upload
2. Return file information
3. Validate upload success

### 3. theaters.js - Theater Management Routes

**Purpose**: Manages theaters, screens, and seating configurations

#### Route Structure:
```javascript
const { 
  getAllTheaters, 
  getTheaterById, 
  createTheater, 
  updateTheater, 
  deleteTheater,
  addScreen,
  updateScreen,
  deleteScreen,
  getScreen,
  updateSeatLayout,
  getTheaterAnalytics,
  bulkUpdateTheaters,
  getNearbyTheaters
} = require('../controllers/theaterController');
```

#### Public Routes:
```javascript
router.get('/', getAllTheaters);
```
**Endpoint**: `GET /api/theaters`
**Purpose**: Get all theaters
**Query Parameters**: `city`, `search`
**Flow**:
1. Apply city filter
2. Search by name/location
3. Return active theaters only

```javascript
router.get('/nearby', getNearbyTheaters);
```
**Endpoint**: `GET /api/theaters/nearby`
**Purpose**: Find theaters by location
**Query Parameters**: `lat`, `lng`, `radius`
**Flow**:
1. Validate coordinates
2. Use geospatial query
3. Return theaters within radius

```javascript
router.get('/analytics', getTheaterAnalytics);
```
**Endpoint**: `GET /api/theaters/analytics`
**Purpose**: Get theater statistics
**Flow**:
1. Aggregate theater data
2. Calculate metrics
3. Group by city
4. Return analytics

#### Screen Management Routes:
```javascript
router.post('/:id/screens', addScreen);
```
**Endpoint**: `POST /api/theaters/:id/screens`
**Purpose**: Add screen to theater
**Flow**:
1. Find theater by ID
2. Validate screen data
3. Generate seat layout
4. Calculate capacity
5. Add to theater
6. Save changes

```javascript
router.get('/:theaterId/screens/:screenId', getScreen);
```
**Endpoint**: `GET /api/theaters/:theaterId/screens/:screenId`
**Purpose**: Get specific screen details
**Flow**:
1. Find theater
2. Find screen within theater
3. Return screen configuration

```javascript
router.put('/:theaterId/screens/:screenId', updateScreen);
```
**Endpoint**: `PUT /api/theaters/:theaterId/screens/:screenId`
**Purpose**: Update screen configuration
**Flow**:
1. Find theater and screen
2. Update screen properties
3. Recalculate capacity
4. Save changes
5. Emit updates

```javascript
router.put('/:theaterId/screens/:screenId/layout', updateSeatLayout);
```
**Endpoint**: `PUT /api/theaters/:theaterId/screens/:screenId/layout`
**Purpose**: Update seat layout specifically
**Flow**:
1. Validate seat layout structure
2. Calculate new capacity
3. Update screen configuration
4. Emit layout changes

---

## Middleware Integration

### Authentication Middleware Types:

#### `auth` - Required Authentication
```javascript
// Requires valid JWT token
// Extracts user information
// Blocks unauthenticated requests
router.get('/protected', auth, controller);
```

#### `optionalAuth` - Optional Authentication
```javascript
// Allows both authenticated and guest users
// Extracts user info if token present
// Continues without user if no token
router.post('/public', optionalAuth, controller);
```

#### `adminAuth` - Admin Only
```javascript
// Requires authentication + admin role
// Validates admin permissions
// Blocks non-admin users
router.delete('/admin-only', adminAuth, controller);
```

### File Upload Middleware:
```javascript
const upload = require('../config/multer');

// Single file upload
router.post('/single', upload.single('fieldname'), controller);

// Multiple files
router.post('/multiple', upload.any(), controller);

// Custom handling
router.post('/custom', (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    // Process files
    next();
  });
}, controller);
```

---

## Request Flow

### Complete Request Lifecycle:

```
1. HTTP Request → Express Server
2. Route Matching → Find matching route pattern
3. Middleware Execution → Run middleware chain
4. Controller Execution → Execute business logic
5. Database Operations → Perform CRUD operations
6. Response Generation → Format and send response
7. Error Handling → Catch and handle errors
```

### Detailed Flow Example:
```javascript
// POST /api/bookings
1. Request arrives at server
2. Express matches route: router.post('/', ...)
3. optionalAuth middleware executes:
   - Checks for JWT token
   - Extracts user info if present
   - Adds user to req.user
4. createBooking controller executes:
   - Validates input data
   - Checks seat availability
   - Creates booking record
   - Updates show data
5. Database operations:
   - Save booking
   - Update show seats
6. Response sent:
   - Status 201 (Created)
   - Booking object returned
7. Real-time events emitted:
   - Notify other users
   - Update admin dashboard
```

---

## Authentication & Authorization

### Token-Based Authentication:
```javascript
// JWT token in Authorization header
Authorization: Bearer <jwt-token>

// Middleware extracts and validates
const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
```

### Role-Based Access Control:
```javascript
// User roles: 'user', 'admin', 'clerk'
if (req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Admin access required' });
}
```

### Ownership Validation:
```javascript
// Check resource ownership
if (booking.user.toString() !== req.user.id.toString()) {
  return res.status(403).json({ message: 'Not authorized' });
}
```

---

## Error Handling

### Route-Level Error Handling:
```javascript
router.get('/example', async (req, res) => {
  try {
    // Route logic
    const result = await someOperation();
    res.json(result);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ message: error.message });
  }
});
```

### Middleware Error Handling:
```javascript
// Custom error middleware
router.use((err, req, res, next) => {
  console.error('Route middleware error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed' });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry' });
  }
  
  res.status(500).json({ message: 'Internal server error' });
});
```

### File Upload Error Handling:
```javascript
upload.single('file')(req, res, (err) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
});
```

---

## Best Practices

### 1. Route Organization:
```javascript
// Group related routes
// Public routes first
router.get('/', publicHandler);
router.get('/:id', publicHandler);

// Authenticated routes
router.post('/', auth, createHandler);
router.put('/:id', auth, updateHandler);

// Admin routes last
router.delete('/:id', adminAuth, deleteHandler);
```

### 2. Middleware Order:
```javascript
// Correct order: specific to general
router.get('/special-endpoint', handler);
router.get('/:id', handler); // More general pattern
```

### 3. Parameter Validation:
```javascript
router.get('/:id', (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
}, getById);
```

### 4. Query Parameter Handling:
```javascript
router.get('/', (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  // Validate and sanitize parameters
  const validatedPage = Math.max(1, parseInt(page));
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit)));
});
```

### 5. Response Consistency:
```javascript
// Consistent response format
res.json({
  success: true,
  data: result,
  message: 'Operation completed',
  pagination: paginationInfo // if applicable
});

// Error responses
res.status(400).json({
  success: false,
  message: 'Error description',
  errors: validationErrors // if applicable
});
```

### 6. File Upload Best Practices:
```javascript
// Validate file types
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!allowedTypes.includes(file.mimetype)) {
  return res.status(400).json({ message: 'Invalid file type' });
}

// Limit file size
const maxSize = 5 * 1024 * 1024; // 5MB
if (file.size > maxSize) {
  return res.status(400).json({ message: 'File too large' });
}
```

---

## Route Testing

### Unit Testing Routes:
```javascript
const request = require('supertest');
const app = require('../app');

describe('GET /api/movies', () => {
  it('should return movies list', async () => {
    const response = await request(app)
      .get('/api/movies')
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

### Authentication Testing:
```javascript
describe('Protected routes', () => {
  it('should require authentication', async () => {
    await request(app)
      .post('/api/bookings')
      .send({ movieId: 'test' })
      .expect(401);
  });
  
  it('should work with valid token', async () => {
    const token = generateTestToken();
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send(validBookingData)
      .expect(201);
  });
});
```

### File Upload Testing:
```javascript
describe('File upload routes', () => {
  it('should upload movie poster', async () => {
    const response = await request(app)
      .post('/api/movies')
      .attach('poster', 'test/fixtures/poster.jpg')
      .field('title', 'Test Movie')
      .expect(201);
      
    expect(response.body.poster).toBeDefined();
  });
});
```

---

## Performance Considerations

### 1. Route Optimization:
- Use specific routes before general patterns
- Implement proper caching headers
- Minimize middleware chain length
- Use lean queries for read-only operations

### 2. File Upload Optimization:
- Stream large files instead of buffering
- Implement file compression
- Use CDN for static file serving
- Validate files before processing

### 3. Database Query Optimization:
- Use indexes for frequently queried fields
- Implement pagination for large datasets
- Use projection to limit returned fields
- Cache frequently accessed data

### 4. Real-time Updates:
- Use rooms for targeted socket emissions
- Batch similar events together
- Implement rate limiting for socket events
- Clean up expired data regularly

---

## Security Considerations

### 1. Input Validation:
```javascript
// Sanitize input data
const sanitizedData = {
  title: req.body.title?.trim(),
  price: parseFloat(req.body.price) || 0
};
```

### 2. Rate Limiting:
```javascript
const rateLimit = require('express-rate-limit');

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 bookings per window
  message: 'Too many booking attempts'
});

router.post('/bookings', bookingLimiter, createBooking);
```

### 3. File Upload Security:
```javascript
// Validate file extensions
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
const fileExtension = path.extname(file.originalname).toLowerCase();
if (!allowedExtensions.includes(fileExtension)) {
  throw new Error('Invalid file type');
}
```

---

## Conclusion

The routes layer serves as the API interface for the BookMyCinema application, providing:

- **Clear Endpoint Structure**: RESTful API design
- **Flexible Authentication**: Multiple auth strategies
- **File Upload Support**: Image and document handling
- **Real-time Integration**: Socket.io event emissions
- **Error Handling**: Comprehensive error management
- **Security**: Input validation and access control
- **Performance**: Optimized query patterns
- **Testing**: Comprehensive test coverage

This architecture ensures a robust, scalable, and maintainable API layer for the movie booking platform.