# BookMyCinema - Complete Functionality Guide

## 🎬 Project Overview
BookMyCinema is a full-stack movie booking application with real-time seat selection, payment processing, and comprehensive admin management.

---

## 🔐 1. Authentication System

### How It Works:
**Technology:** Clerk Authentication + Custom User Management

#### User Registration & Login
```javascript
// Frontend: ClerkSignUp.js / ClerkSignIn.js
- User registers/logs in through Clerk
- Clerk handles password security, email verification
- JWT tokens generated for session management
```

#### User Synchronization
```javascript
// Backend: services/userSyncService.js
- Clerk webhooks sync user data to MongoDB
- Creates local user profiles
- Handles role assignment (user/admin)
```

#### Protected Routes
```javascript
// Frontend: ClerkProtectedRoute.js
- Checks authentication status
- Redirects unauthenticated users
- Validates admin permissions
```

**Files Involved:**
- `frontend/src/pages/ClerkSignIn.js`
- `frontend/src/pages/ClerkSignUp.js`
- `backend/services/userSyncService.js`
- `backend/middleware/auth.js`

---

## 🎥 2. Movie Management System

### How It Works:

#### Movie Display (User Side)
```javascript
// Frontend: Movies.js, Home.js
1. Fetch movies from API
2. Filter by status (Now Showing, Coming Soon)
3. Display in cards/carousels
4. Search and filter functionality
```

#### Movie CRUD (Admin Side)
```javascript
// Backend: controllers/movieController.js
- getAllMovies(): Fetch all movies with filters
- createMovie(): Add new movie with poster upload
- updateMovie(): Edit movie details
- deleteMovie(): Soft delete (set isActive: false)
- updateComingSoonMovies(): Auto-update movie status
```

#### Movie Status Management
```javascript
// Automatic status updates based on dates
if (movie.startDate > today) → isUpcoming: true
if (movie.startDate <= today <= movie.endDate) → Now Showing
if (movie.endDate < today) → Expired (deactivated)
```

**Key Features:**
- ✅ Movie poster upload with Multer
- ✅ TMDB integration for movie data
- ✅ Automatic status updates
- ✅ Review and rating system
- ✅ Search and filtering

**Files Involved:**
- `backend/controllers/movieController.js`
- `backend/models/Movie.js`
- `frontend/src/pages/Movies.js`
- `frontend/src/components/common/MovieCard.js`

---

## 🏛 3. Theater Management System

### How It Works:

#### Theater Structure
```javascript
// Backend: models/Theater.js
Theater {
  name: "PVR Cinemas",
  location: "Mumbai",
  screens: [
    {
      screenNumber: 1,
      name: "Screen 1",
      capacity: 100,
      seatLayout: [
        { row: "A", seats: [1, 2, 3, null, 4, 5] }, // null = gap
        { row: "B", seats: [1, 2, 3, null, 4, 5] }
      ]
    }
  ]
}
```

#### Seat Layout System
```javascript
// Frontend: components/booking/CustomSeatLayout.js
- Dynamic seat grid generation
- Visual seat representation
- Interactive seat selection
- Real-time availability updates
```

#### Theater CRUD Operations
```javascript
// Backend: controllers/theaterController.js
- getAllTheaters(): List all theaters
- createTheater(): Add new theater
- addScreen(): Add screen to existing theater
- updateTheater(): Edit theater details
```

**Key Features:**
- ✅ Multi-screen theaters
- ✅ Custom seat layouts
- ✅ Theater amenities management
- ✅ Location-based filtering
- ✅ Capacity management

**Files Involved:**
- `backend/controllers/theaterController.js`
- `backend/models/Theater.js`
- `frontend/src/pages/Theaters.js`
- `frontend/src/components/theaters/TheaterCard.js`

---

## 📅 4. Show Scheduling System

### How It Works:

#### Show Creation (Admin)
```javascript
// Backend: controllers/showController.js
createShow() {
  1. Validate movie and theater exist
  2. Check screen availability
  3. Set pricing and seat availability
  4. Create show record
  5. Initialize empty bookedSeats array
}
```

#### Show Display (User)
```javascript
// Frontend: ShowTimes.js
1. Fetch shows by movie ID
2. Group by theater and date
3. Display available time slots
4. Show seat availability count
```

#### Automatic Cleanup
```javascript
// Backend: controllers/showController.js
startAutoCleanup() {
  - Runs every hour
  - Removes shows older than current time
  - Deactivates movies with no future shows
  - Cleans up orphaned data
}
```

**Key Features:**
- ✅ Multi-theater show scheduling
- ✅ Dynamic pricing
- ✅ Automatic cleanup of expired shows
- ✅ Seat availability tracking
- ✅ Show conflict prevention

**Files Involved:**
- `backend/controllers/showController.js`
- `backend/models/Show.js`
- `frontend/src/pages/ShowTimes.js`
- `frontend/src/components/shows/ShowsList.js`

---

## 💺 5. Real-Time Seat Booking System

### How It Works:

#### Seat Locking Mechanism
```javascript
// Backend: controllers/bookingController.js
const seatLocks = new Map(); // In-memory storage

lockSeats(showId, seats, userId, lockType) {
  1. Check for existing locks by other users
  2. Lock seats for current user
  3. Set timeout for auto-release
  4. Emit real-time updates to all users
}
```

#### Lock Types & Timeouts
```javascript
'selection' → 1 minute lock (browsing)
'booking' → 5 minutes lock (payment process)
'payment_cancelled' → 2 minutes lock (payment failed)
```

#### Real-Time Updates
```javascript
// Backend: middleware/realtime.js
Socket.io Events:
- 'seat-selected' → User selects seats
- 'seat-released' → User releases seats
- 'seat-conflict' → Conflict detected
- 'seats-auto-released' → Timeout expired
```

#### Booking Process
```javascript
// Frontend: BookingPage.js
1. User selects seats → Lock seats
2. Navigate to payment → Extend lock
3. Payment success → Permanent booking
4. Payment failure → Release locks
```

**Key Features:**
- ✅ Real-time seat locking
- ✅ Conflict prevention
- ✅ Auto-release expired locks
- ✅ Visual seat status updates
- ✅ Multi-user booking support

**Files Involved:**
- `backend/controllers/bookingController.js`
- `backend/middleware/realtime.js`
- `frontend/src/pages/BookingPage.js`
- `frontend/src/components/booking/CustomSeatLayout.js`

---

## 💳 6. Payment Processing System

### How It Works:

#### Stripe Integration
```javascript
// Backend: routes/payment.js
1. Create payment intent with Stripe
2. Calculate total amount (seats × price)
3. Return client secret to frontend
4. Handle payment confirmation
```

#### Payment Flow
```javascript
// Frontend: PaymentPage.js
1. Display booking summary
2. Stripe payment form
3. Process payment
4. Handle success/failure
5. Redirect to confirmation
```

#### Payment Webhook
```javascript
// Backend: routes/webhooks.js
- Stripe webhook verification
- Payment status updates
- Booking confirmation
- Email notifications
```

**Key Features:**
- ✅ Secure Stripe integration
- ✅ Payment intent creation
- ✅ Webhook handling
- ✅ Refund processing
- ✅ Payment status tracking

**Files Involved:**
- `backend/routes/payment.js`
- `backend/routes/webhooks.js`
- `frontend/src/pages/PaymentPage.js`
- `frontend/src/components/payment/StripePayment.js`

---

## 🎫 7. Booking Management System

### How It Works:

#### Booking Creation
```javascript
// Backend: controllers/bookingController.js
createBooking() {
  1. Validate show and seats
  2. Check seat availability
  3. Lock seats permanently
  4. Generate booking ID and ticket ID
  5. Update show's booked seats
  6. Send confirmation email
  7. Emit real-time updates
}
```

#### Booking Display
```javascript
// Frontend: MyBookings.js
1. Fetch user's bookings
2. Display booking cards
3. Show QR codes for tickets
4. Allow cancellation (if applicable)
```

#### Digital Ticket Generation
```javascript
// Frontend: components/ticket/MovieTicket.js
- QR code generation
- Booking details display
- Printable format
- Barcode for scanning
```

**Key Features:**
- ✅ Unique booking IDs
- ✅ Digital ticket generation
- ✅ QR code integration
- ✅ Email confirmations
- ✅ Booking history

**Files Involved:**
- `backend/controllers/bookingController.js`
- `backend/models/Booking.js`
- `frontend/src/pages/MyBookings.js`
- `frontend/src/components/ticket/MovieTicket.js`

---

## 📧 8. Email Notification System

### How It Works:

#### Email Service Setup
```javascript
// Backend: services/emailService.js
- Nodemailer configuration
- SMTP server setup
- Email templates
- Attachment support
```

#### Booking Confirmation Email
```javascript
sendBookingConfirmation(booking) {
  1. Generate email template
  2. Include booking details
  3. Attach QR code
  4. Send via SMTP
  5. Log email status
}
```

#### Email Templates
```javascript
Templates include:
- Booking confirmation
- Cancellation notice
- Payment receipt
- Show reminders
```

**Key Features:**
- ✅ Automated email sending
- ✅ HTML email templates
- ✅ QR code attachments
- ✅ SMTP configuration
- ✅ Email logging

**Files Involved:**
- `backend/services/emailService.js`
- Email templates in service file

---

## 👨‍💼 9. Admin Dashboard System

### How It Works:

#### Dashboard Analytics
```javascript
// Backend: routes/dashboard.js
- Total bookings count
- Revenue calculations
- Popular movies
- Theater performance
- User statistics
```

#### Movie Management
```javascript
// Frontend: pages/admin/AdminMovies.js
- Add/Edit/Delete movies
- Upload movie posters
- Set release dates
- Manage movie status
```

#### Theater Management
```javascript
// Frontend: pages/admin/AdminTheaters.js
- Add/Edit theaters
- Configure screens
- Set seat layouts
- Manage amenities
```

#### Show Management
```javascript
// Frontend: pages/admin/AdminShows.js
- Create show schedules
- Set pricing
- Manage time slots
- Bulk operations
```

#### Booking Management
```javascript
// Frontend: pages/admin/AdminBookings.js
- View all bookings
- Search and filter
- Booking analytics
- Refund processing
```

**Key Features:**
- ✅ Comprehensive analytics
- ✅ CRUD operations for all entities
- ✅ Bulk operations
- ✅ Data visualization
- ✅ Export functionality

**Files Involved:**
- `frontend/src/pages/admin/AdminDashboard.js`
- `frontend/src/pages/admin/AdminMovies.js`
- `frontend/src/pages/admin/AdminTheaters.js`
- `frontend/src/pages/admin/AdminShows.js`
- `frontend/src/pages/admin/AdminBookings.js`

---

## 🔄 10. Real-Time Communication System

### How It Works:

#### Socket.io Setup
```javascript
// Backend: middleware/realtime.js
- Initialize Socket.io server
- Handle client connections
- Manage user sessions
- Emit targeted events
```

#### Real-Time Events
```javascript
Events handled:
- 'seat-selected' → User selects seats
- 'seat-released' → User releases seats
- 'booking-created' → New booking made
- 'show-updated' → Show details changed
- 'seats-auto-released' → Lock expired
```

#### Client-Side Socket Handling
```javascript
// Frontend: contexts/SocketContext.js
- Connect to Socket.io server
- Listen for real-time events
- Update UI based on events
- Handle connection errors
```

**Key Features:**
- ✅ Real-time seat updates
- ✅ Live booking notifications
- ✅ Instant conflict resolution
- ✅ Connection management
- ✅ Event broadcasting

**Files Involved:**
- `backend/middleware/realtime.js`
- `frontend/src/contexts/SocketContext.js`

---

## 🧹 11. Automated Cleanup System

### How It Works:

#### Show Cleanup
```javascript
// Backend: controllers/cleanupController.js
runFullCleanup() {
  1. Find expired shows (date < today)
  2. Delete expired shows
  3. Find movies with no active shows
  4. Deactivate orphaned movies
  5. Log cleanup results
}
```

#### Scheduled Cleanup
```javascript
// Backend: server.js
- Runs cleanup on server startup
- Schedules periodic cleanup (every hour)
- Automatic movie status updates
- Seat lock cleanup
```

#### Coming Soon Updates
```javascript
// Backend: controllers/movieController.js
updateComingSoonMovies() {
  - Check movie start dates
  - Update isUpcoming status
  - Activate movies on release date
  - Runs every second for real-time updates
}
```

**Key Features:**
- ✅ Automatic expired show removal
- ✅ Movie status updates
- ✅ Orphaned data cleanup
- ✅ Scheduled maintenance
- ✅ Performance optimization

**Files Involved:**
- `backend/controllers/cleanupController.js`
- `backend/controllers/movieController.js`

---

## 🔍 12. Search & Filter System

### How It Works:

#### Movie Search
```javascript
// Frontend: Movies.js
- Text search in movie titles
- Genre filtering
- Language filtering
- Status filtering (Now Showing, Coming Soon)
- Sort by rating, date, popularity
```

#### Theater Search
```javascript
// Frontend: Theaters.js
- Location-based search
- Amenity filtering
- Distance sorting
- Capacity filtering
```

#### Admin Search
```javascript
// Backend: All admin controllers
- Pagination support
- Search across multiple fields
- Date range filtering
- Status filtering
```

**Key Features:**
- ✅ Full-text search
- ✅ Multiple filter options
- ✅ Real-time search results
- ✅ Pagination
- ✅ Sort functionality

**Files Involved:**
- `frontend/src/pages/Movies.js`
- `frontend/src/pages/Theaters.js`
- All admin page components

---

## 📱 13. Responsive Design System

### How It Works:

#### Mobile-First Design
```javascript
// CSS: styles/*.css
- Bootstrap 5 grid system
- Custom responsive breakpoints
- Touch-friendly interfaces
- Mobile navigation
```

#### Adaptive Components
```javascript
// Frontend: All components
- Responsive movie cards
- Mobile-optimized seat selection
- Collapsible navigation
- Touch gestures support
```

**Key Features:**
- ✅ Mobile-responsive design
- ✅ Touch-friendly interfaces
- ✅ Adaptive layouts
- ✅ Cross-browser compatibility
- ✅ Performance optimization

---

## 🔒 14. Security Features

### How It Works:

#### Authentication Security
```javascript
- JWT token validation
- Clerk secure authentication
- Role-based access control
- Session management
```

#### API Security
```javascript
- CORS configuration
- Request validation
- Rate limiting (can be added)
- Input sanitization
```

#### Payment Security
```javascript
- Stripe secure processing
- Webhook signature verification
- PCI compliance
- Encrypted data transmission
```

**Key Features:**
- ✅ Secure authentication
- ✅ Protected API endpoints
- ✅ Encrypted payments
- ✅ Data validation
- ✅ CORS protection

---

## 📊 15. Analytics & Reporting

### How It Works:

#### Dashboard Metrics
```javascript
// Backend: routes/dashboard.js
- Total revenue calculation
- Booking trends
- Popular movies
- Theater performance
- User engagement
```

#### Performance Monitoring
```javascript
- Database query optimization
- API response times
- Error logging
- User activity tracking
```

**Key Features:**
- ✅ Revenue analytics
- ✅ Booking statistics
- ✅ Performance metrics
- ✅ User insights
- ✅ Trend analysis

---

## 🚀 Complete User Journey Flow

### 1. **User Registration/Login**
```
User → Clerk Auth → JWT Token → Local User Profile → Dashboard Access
```

### 2. **Movie Discovery**
```
Home Page → Movie Carousel → Search/Filter → Movie Details → Show Times
```

### 3. **Booking Process**
```
Select Show → Choose Seats → Real-time Locking → Payment → Confirmation → Email
```

### 4. **Admin Management**
```
Admin Login → Dashboard → Manage Movies/Theaters/Shows → Analytics → Reports
```

### 5. **Real-time Updates**
```
User Action → Socket.io → Server Processing → Database Update → Broadcast to All Users
```

---

## 🔧 Technical Architecture

### Backend Stack:
- **Server**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: Clerk + JWT
- **Payment**: Stripe
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **File Upload**: Multer

### Frontend Stack:
- **Framework**: React.js 18
- **Routing**: React Router DOM
- **UI**: React Bootstrap + Custom CSS
- **State**: Context API
- **HTTP**: Axios
- **Real-time**: Socket.io Client
- **Animations**: Framer Motion, AOS, GSAP

### Key Features Summary:
✅ **Real-time seat booking** with conflict prevention
✅ **Secure payment processing** with Stripe
✅ **Automated cleanup** and maintenance
✅ **Comprehensive admin dashboard**
✅ **Email notifications** and confirmations
✅ **Mobile-responsive design**
✅ **Search and filtering** capabilities
✅ **Digital ticket generation** with QR codes
✅ **Multi-theater support** with custom layouts
✅ **Role-based access control**

This documentation covers all major functionalities in your BookMyCinema project. Each feature is designed to work seamlessly with others, creating a complete movie booking ecosystem.