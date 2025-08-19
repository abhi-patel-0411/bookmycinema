# Controllers Documentation - BookMyCinema Backend

## Table of Contents
1. [Overview](#overview)
2. [Controller Architecture](#controller-architecture)
3. [Individual Controllers](#individual-controllers)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Overview

Controllers in the BookMyCinema backend handle HTTP requests, process business logic, and return responses. Each controller manages a specific domain of the application.

### Controller Files:
- `bookingController.js` - Booking management and seat selection
- `cleanupController.js` - Database cleanup operations
- `movieController.js` - Movie CRUD operations
- `showController.js` - Show scheduling and management
- `theaterController.js` - Theater and screen management
- `userController.js` - User authentication and profile management

---

## Controller Architecture

### Standard Controller Pattern
```javascript
// Import dependencies
const Model = require('../models/ModelName');
const { emitToUsers } = require('../middleware/realtime');

// Controller function
const controllerFunction = async (req, res) => {
  try {
    // 1. Extract data from request
    const { param1, param2 } = req.body;
    const { id } = req.params;
    
    // 2. Validate input
    if (!param1) {
      return res.status(400).json({ message: 'Param1 is required' });
    }
    
    // 3. Business logic
    const result = await Model.findById(id);
    
    // 4. Return response
    res.json({ success: true, data: result });
  } catch (error) {
    // 5. Error handling
    res.status(500).json({ message: error.message });
  }
};

module.exports = { controllerFunction };
```

---

## Individual Controllers

### 1. bookingController.js

**Purpose**: Manages movie ticket bookings, seat selection, and booking lifecycle

#### Key Functions:

##### `getAllBookings(req, res)`
```javascript
// GET /api/bookings
// Purpose: Retrieve all bookings with pagination and filtering
// Parameters: page, limit, search, status, date, theater
// Returns: { bookings: [], pagination: {} }
```
**How it works**:
1. Extracts query parameters for filtering
2. Builds MongoDB query with search conditions
3. Applies pagination (skip/limit)
4. Populates related movie and theater data
5. Returns bookings with pagination info

##### `createBooking(req, res)`
```javascript
// POST /api/bookings
// Purpose: Create new booking with seat locking mechanism
// Body: { showId, seats, totalAmount, seatDetails }
// Returns: Created booking object
```
**How it works**:
1. Validates user authentication
2. Checks show availability
3. Implements seat locking to prevent conflicts
4. Validates seat availability in database
5. Creates booking record
6. Updates show's booked seats
7. Sends confirmation email
8. Emits real-time updates

##### `selectSeats(req, res)`
```javascript
// POST /api/bookings/select-seats
// Purpose: Temporarily lock seats during selection
// Body: { showId, seats }
// Returns: { success: true, expiresIn: 60 }
```
**How it works**:
1. Checks if seats are already booked
2. Implements in-memory seat locking
3. Sets auto-release timeout (60 seconds)
4. Prevents conflicts between users
5. Emits seat selection events

##### `cancelBooking(req, res)`
```javascript
// PUT /api/bookings/:id/cancel
// Purpose: Cancel booking with past show validation
// Returns: Updated booking status
```
**How it works**:
1. Validates booking ownership
2. Checks if show is in the past
3. Prevents cancellation of past shows
4. Frees up seats for future shows
5. Updates booking status to 'cancelled'

##### `deletePastShowBookings(req, res)`
```javascript
// DELETE /api/bookings/cleanup/past-shows
// Purpose: Bulk delete old booking records
// Query: days (default: 30)
// Returns: { deletedCount, message }
```
**How it works**:
1. Finds bookings older than specified days
2. Filters for actual past shows
3. Bulk deletes matching records
4. Returns cleanup statistics

#### Seat Locking Mechanism:
```javascript
const seatLocks = new Map(); // showId -> { seatId: { userId, timestamp, type } }

// Lock types:
// - 'selection': 1 minute timeout
// - 'booking': 5 minutes timeout  
// - 'payment_cancelled': 2 minutes timeout
```

### 2. movieController.js

**Purpose**: Manages movie catalog, CRUD operations, and movie data

#### Key Functions:

##### `getAllMovies(req, res)`
```javascript
// GET /api/movies
// Purpose: Retrieve movies with filtering
// Query: search, genre, language, isActive
// Returns: Array of movie objects
```
**How it works**:
1. Builds query based on filters
2. Applies text search on title
3. Filters by genre and language
4. Sorts by creation date
5. Returns filtered movie list

##### `createMovie(req, res)`
```javascript
// POST /api/movies
// Purpose: Add new movie to catalog
// Body: { title, genre, duration, language, poster, price }
// Returns: Created movie object
```
**How it works**:
1. Validates required fields
2. Creates new movie document
3. Saves to database
4. Emits real-time update
5. Returns created movie

##### `updateMovie(req, res)`
```javascript
// PUT /api/movies/:id
// Purpose: Update existing movie
// Body: Updated movie fields
// Returns: Updated movie object
```
**How it works**:
1. Finds movie by ID
2. Updates specified fields
3. Validates data integrity
4. Saves changes
5. Emits update event

##### `deleteMovie(req, res)`
```javascript
// DELETE /api/movies/:id
// Purpose: Soft delete movie (set isActive: false)
// Returns: Success message
```
**How it works**:
1. Finds movie by ID
2. Sets isActive to false
3. Preserves data for existing bookings
4. Returns confirmation

### 3. theaterController.js

**Purpose**: Manages theaters, screens, and seating layouts

#### Key Functions:

##### `getAllTheaters(req, res)`
```javascript
// GET /api/theaters
// Purpose: Get theaters with basic filtering
// Query: city, search
// Returns: Array of theater objects
```
**How it works**:
1. Filters by city using regex
2. Searches theater name and location
3. Returns only active theaters
4. Sorts alphabetically

##### `addScreen(req, res)`
```javascript
// POST /api/theaters/:id/screens
// Purpose: Add screen with custom seat layout
// Body: { name, capacity, screenType, seatLayout }
// Returns: Updated theater with new screen
```
**How it works**:
1. Finds theater by ID
2. Validates seat layout structure
3. Calculates capacity from layout
4. Generates default layout if none provided
5. Adds screen to theater
6. Updates theater document

##### `updateScreen(req, res)`
```javascript
// PUT /api/theaters/:theaterId/screens/:screenId
// Purpose: Update screen configuration
// Body: Updated screen fields
// Returns: Updated theater object
```
**How it works**:
1. Finds theater and screen
2. Updates screen properties
3. Recalculates capacity if layout changed
4. Saves theater document
5. Emits update event

### 4. showController.js

**Purpose**: Manages movie showtimes and scheduling

#### Key Functions:

##### `getAllShows(req, res)`
```javascript
// GET /api/shows
// Purpose: Get shows with filtering and population
// Query: movie, theater, date, city
// Returns: Array of show objects with movie/theater data
```
**How it works**:
1. Builds complex query with filters
2. Populates movie and theater references
3. Filters by date range
4. Sorts by show date and time
5. Returns enriched show data

##### `createShow(req, res)`
```javascript
// POST /api/shows
// Purpose: Schedule new movie show
// Body: { movie, theater, screen, showDate, showTime, price }
// Returns: Created show object
```
**How it works**:
1. Validates movie and theater existence
2. Checks screen availability
3. Prevents scheduling conflicts
4. Calculates available seats from screen
5. Creates show document
6. Emits scheduling update

##### `getShowById(req, res)`
```javascript
// GET /api/shows/:id
// Purpose: Get detailed show information
// Returns: Show with populated movie, theater, and screen data
```
**How it works**:
1. Finds show by ID
2. Populates all related data
3. Includes seat availability
4. Returns complete show information

### 5. userController.js

**Purpose**: Manages user accounts, authentication, and profiles

#### Key Functions:

##### `getAllUsers(req, res)`
```javascript
// GET /api/users
// Purpose: Get users with filtering and pagination
// Query: page, limit, search, role, isActive
// Returns: { users: [], pagination: {} }
```
**How it works**:
1. Builds search query with regex
2. Filters by role and status
3. Applies pagination
4. Excludes password field
5. Returns user list with pagination

##### `createUser(req, res)`
```javascript
// POST /api/users
// Purpose: Create new user account
// Body: { name, email, phone, password, role }
// Returns: Created user (without password)
```
**How it works**:
1. Checks for existing user
2. Hashes password with bcrypt
3. Creates user document
4. Removes password from response
5. Emits user creation event

##### `updateUserProfile(req, res)`
```javascript
// PUT /api/users/profile
// Purpose: Update authenticated user's profile
// Body: Updated user fields
// Returns: Updated user object
```
**How it works**:
1. Validates user authentication
2. Prevents role changes
3. Hashes new password if provided
4. Updates user document
5. Returns updated profile

##### `getUserStats(req, res)`
```javascript
// GET /api/users/stats
// Purpose: Get user statistics
// Returns: { totalUsers, activeUsers, adminUsers }
```
**How it works**:
1. Counts total users
2. Counts active users
3. Counts admin users
4. Returns statistics object

### 6. cleanupController.js

**Purpose**: Database maintenance and cleanup operations

#### Key Functions:

##### `cleanupExpiredData(req, res)`
```javascript
// DELETE /api/cleanup/expired
// Purpose: Remove old and expired data
// Returns: Cleanup statistics
```
**How it works**:
1. Identifies expired bookings
2. Removes old session data
3. Cleans up temporary files
4. Returns cleanup report

---

## API Endpoints

### Booking Endpoints
```
GET    /api/bookings              - Get all bookings
POST   /api/bookings              - Create booking
GET    /api/bookings/:id          - Get booking details
PUT    /api/bookings/:id/cancel   - Cancel booking
DELETE /api/bookings/:id          - Delete booking
POST   /api/bookings/select-seats - Lock seats temporarily
POST   /api/bookings/release-seats - Release seat locks
DELETE /api/bookings/cleanup/past-shows - Bulk delete old bookings
```

### Movie Endpoints
```
GET    /api/movies     - Get all movies
POST   /api/movies     - Create movie
GET    /api/movies/:id - Get movie details
PUT    /api/movies/:id - Update movie
DELETE /api/movies/:id - Delete movie
```

### Theater Endpoints
```
GET    /api/theaters                           - Get all theaters
POST   /api/theaters                           - Create theater
GET    /api/theaters/:id                       - Get theater details
PUT    /api/theaters/:id                       - Update theater
DELETE /api/theaters/:id                       - Delete theater
POST   /api/theaters/:id/screens               - Add screen
PUT    /api/theaters/:theaterId/screens/:screenId - Update screen
DELETE /api/theaters/:theaterId/screens/:screenId - Delete screen
```

### Show Endpoints
```
GET    /api/shows     - Get all shows
POST   /api/shows     - Create show
GET    /api/shows/:id - Get show details
PUT    /api/shows/:id - Update show
DELETE /api/shows/:id - Delete show
```

### User Endpoints
```
GET    /api/users          - Get all users
POST   /api/users          - Create user
GET    /api/users/:id      - Get user details
PUT    /api/users/:id      - Update user
DELETE /api/users/:id      - Delete user
GET    /api/users/profile  - Get own profile
PUT    /api/users/profile  - Update own profile
GET    /api/users/stats    - Get user statistics
```

---

## Error Handling

### Standard Error Response Format
```javascript
{
  "message": "Error description",
  "error": "Detailed error info (development only)",
  "statusCode": 400
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data, seat conflicts)
- `500` - Internal Server Error

### Error Handling Pattern
```javascript
try {
  // Controller logic
} catch (error) {
  console.error('Controller error:', error);
  
  // Handle specific errors
  if (error.code === 11000) {
    return res.status(400).json({ message: 'Duplicate entry' });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed' });
  }
  
  // Generic error
  res.status(500).json({ message: error.message });
}
```

---

## Best Practices

### 1. Input Validation
```javascript
// Always validate required fields
const { title, duration } = req.body;
if (!title || !duration) {
  return res.status(400).json({ message: 'Title and duration are required' });
}
```

### 2. Database Queries
```javascript
// Use lean() for read-only operations
const movies = await Movie.find(query).lean();

// Populate only needed fields
const shows = await Show.find()
  .populate('movie', 'title poster')
  .populate('theater', 'name location');
```

### 3. Error Logging
```javascript
// Log errors for debugging
console.error('Booking creation error:', error);
console.log('Request data:', req.body);
```

### 4. Response Consistency
```javascript
// Consistent response format
res.json({
  success: true,
  message: 'Operation completed',
  data: result
});
```

### 5. Security Considerations
```javascript
// Remove sensitive data
const userResponse = user.toObject();
delete userResponse.password;

// Validate ownership
if (booking.user.toString() !== userId.toString()) {
  return res.status(403).json({ message: 'Not authorized' });
}
```

### 6. Real-time Updates
```javascript
// Emit events for real-time features
emitToUsers('booking-created', { bookingId: booking._id });
emitToAdmin('new-booking', booking);
```

---

## Controller Workflow

### 1. Request Processing Flow
```
HTTP Request → Route → Middleware → Controller → Database → Response
```

### 2. Typical Controller Execution
```
1. Extract request data (params, body, query)
2. Validate input data
3. Authenticate/authorize user
4. Execute business logic
5. Database operations
6. Process results
7. Send response
8. Handle errors
```

### 3. Database Interaction Pattern
```javascript
// 1. Find/Create/Update
const document = await Model.findById(id);

// 2. Validate existence
if (!document) {
  return res.status(404).json({ message: 'Not found' });
}

// 3. Modify data
document.field = newValue;

// 4. Save changes
await document.save();

// 5. Return result
res.json(document);
```

---

## Performance Considerations

### 1. Database Optimization
- Use indexes for frequently queried fields
- Implement pagination for large datasets
- Use lean() queries when possible
- Populate only necessary fields

### 2. Memory Management
- Clean up temporary data (seat locks)
- Implement proper garbage collection
- Monitor memory usage

### 3. Caching Strategy
- Cache frequently accessed data
- Implement Redis for session storage
- Use CDN for static assets

### 4. Real-time Efficiency
- Limit socket connections
- Batch similar events
- Use rooms for targeted updates

---

## Testing Controllers

### 1. Unit Testing
```javascript
// Test individual controller functions
describe('movieController', () => {
  it('should create movie', async () => {
    const req = { body: { title: 'Test Movie' } };
    const res = { json: jest.fn(), status: jest.fn() };
    
    await createMovie(req, res);
    
    expect(res.json).toHaveBeenCalled();
  });
});
```

### 2. Integration Testing
```javascript
// Test API endpoints
describe('POST /api/movies', () => {
  it('should create new movie', async () => {
    const response = await request(app)
      .post('/api/movies')
      .send({ title: 'Test Movie' })
      .expect(201);
      
    expect(response.body.title).toBe('Test Movie');
  });
});
```

### 3. Error Testing
```javascript
// Test error scenarios
it('should return 400 for invalid data', async () => {
  const response = await request(app)
    .post('/api/movies')
    .send({}) // Missing required fields
    .expect(400);
    
  expect(response.body.message).toContain('required');
});
```

---

## Conclusion

The controller layer serves as the core business logic handler in the BookMyCinema application. Each controller is designed with:

- **Single Responsibility**: Each handles one domain
- **Error Handling**: Comprehensive error management
- **Validation**: Input validation and sanitization
- **Security**: Authentication and authorization
- **Performance**: Optimized database queries
- **Real-time**: Socket.io integration for live updates

This architecture ensures maintainable, scalable, and robust API endpoints for the movie booking platform.