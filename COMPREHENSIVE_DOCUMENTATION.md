# BookMyCinema - Comprehensive Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Documentation](#backend-documentation)
5. [Frontend Documentation](#frontend-documentation)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Authentication & Authorization](#authentication--authorization)
9. [Features & Functionality](#features--functionality)
10. [File Organization](#file-organization)
11. [Setup & Installation](#setup--installation)
12. [Deployment](#deployment)

---

## 🎬 Project Overview

**BookMyCinema** is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) movie booking application that allows users to browse movies, select theaters, book seats, and make payments. The application includes both user and admin functionalities with real-time seat booking, payment integration, and comprehensive theater management.

### Key Features
- 🎥 Movie browsing and search
- 🎭 Theater and show management
- 💺 Real-time seat selection
- 💳 Stripe payment integration
- 📱 Responsive design
- 👨‍💼 Admin dashboard
- 🔐 Clerk authentication
- 📧 Email notifications
- 🎫 Digital ticket generation

---

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk SDK
- **Payment**: Stripe
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Email**: Nodemailer
- **Security**: bcryptjs, JWT

### Frontend
- **Framework**: React.js 18
- **Routing**: React Router DOM
- **UI Framework**: React Bootstrap
- **Styling**: CSS3, Bootstrap 5
- **Animations**: Framer Motion, AOS, GSAP
- **State Management**: Context API
- **HTTP Client**: Axios
- **Authentication**: Clerk React
- **Payment**: Stripe React
- **Real-time**: Socket.io Client

### Development Tools
- **Package Manager**: npm
- **Development Server**: Nodemon
- **Build Tool**: React Scripts
- **Version Control**: Git

---

## 📁 Project Structure

```
bookmycinema/
├── backend/                    # Node.js Backend
│   ├── config/                # Configuration files
│   ├── controllers/           # Business logic controllers
│   ├── functions/            # Utility functions
│   ├── middleware/           # Custom middleware
│   ├── models/               # MongoDB models
│   ├── routes/               # API routes
│   ├── services/             # External services
│   ├── uploads/              # File uploads
│   └── server.js             # Main server file
├── frontend/                  # React Frontend
│   ├── public/               # Static assets
│   ├── src/                  # Source code
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── styles/           # CSS files
│   │   └── utils/            # Utility functions
│   └── package.json          # Frontend dependencies
└── README.md                 # Project documentation
```

---

## 🔧 Backend Documentation

### Server Configuration (`server.js`)
The main server file configures:
- Express application setup
- CORS configuration for multiple origins
- MongoDB connection
- Socket.io initialization
- Route mounting
- Middleware setup
- Auto-cleanup schedulers
- User synchronization with Clerk

### Controllers (`/controllers/`)

#### 1. **movieController.js**
- `getAllMovies()` - Fetch all active movies
- `getMovieById()` - Get specific movie details
- `createMovie()` - Add new movie (Admin)
- `updateMovie()` - Update movie details (Admin)
- `deleteMovie()` - Soft delete movie (Admin)
- `updateComingSoonMovies()` - Auto-update movie status

#### 2. **theaterController.js**
- `getAllTheaters()` - Fetch all theaters
- `getTheaterById()` - Get theater details
- `createTheater()` - Add new theater (Admin)
- `updateTheater()` - Update theater info (Admin)
- `deleteTheater()` - Remove theater (Admin)
- `addScreen()` - Add screen to theater (Admin)

#### 3. **showController.js**
- `getAllShows()` - Get all shows
- `getShowsByMovie()` - Get shows for specific movie
- `getShowsByTheater()` - Get shows for specific theater
- `createShow()` - Create new show (Admin)
- `updateShow()` - Update show details (Admin)
- `deleteShow()` - Remove show (Admin)
- `startAutoCleanup()` - Auto-remove expired shows

#### 4. **bookingController.js**
- `createBooking()` - Create new booking
- `getUserBookings()` - Get user's bookings
- `getBookingById()` - Get specific booking
- `cancelBooking()` - Cancel booking
- `getAllBookings()` - Get all bookings (Admin)

#### 5. **userController.js**
- `getAllUsers()` - Get all users (Admin)
- `getUserById()` - Get user details
- `updateUser()` - Update user info
- `deleteUser()` - Remove user (Admin)

#### 6. **cleanupController.js**
- `runFullCleanup()` - Clean expired shows and inactive movies
- `cleanupExpiredShows()` - Remove past shows
- `deactivateMoviesWithoutShows()` - Deactivate movies without active shows

### Models (`/models/`)

#### 1. **Movie.js**
```javascript
{
  title: String,
  description: String,
  genre: [String],
  duration: Number,
  language: String,
  releaseDate: Date,
  rating: Number,
  poster: String,
  trailer: String,
  cast: [{name, image, role}],
  director: String,
  price: Number,
  isActive: Boolean,
  tmdbId: Number,
  reviews: [reviewSchema],
  startDate: Date,
  endDate: Date,
  isUpcoming: Boolean
}
```

#### 2. **Theater.js**
```javascript
{
  name: String,
  location: String,
  address: {street, area, city, state, pincode},
  coordinates: {latitude, longitude},
  contactInfo: {phone, email, website, manager},
  operatingHours: {weekdays, weekends},
  screens: [screenSchema],
  amenities: [String],
  facilities: {parking, foodCourt, restrooms, etc.},
  pricing: {basePrice, premiumPrice, surcharges},
  status: {isActive, isVerified, maintenanceMode}
}
```

#### 3. **Show.js**
```javascript
{
  movie: ObjectId,
  theater: ObjectId,
  screen: ObjectId,
  date: Date,
  time: String,
  price: Number,
  availableSeats: [String],
  bookedSeats: [String],
  totalSeats: Number,
  status: String
}
```

#### 4. **Booking.js**
```javascript
{
  user: String,
  userDetails: {clerkId, email},
  show: ObjectId,
  movieTitle: String,
  theaterName: String,
  showDate: Date,
  showTime: String,
  seats: [String],
  totalAmount: Number,
  status: String,
  paymentStatus: String,
  bookingId: String,
  ticketId: String
}
```

### Routes (`/routes/`)

#### API Endpoints Structure:
- `/api/auth` - Authentication routes
- `/api/users` - User management
- `/api/movies` - Movie operations
- `/api/theaters` - Theater management
- `/api/shows` - Show scheduling
- `/api/bookings` - Booking operations
- `/api/payment` - Payment processing
- `/api/admin` - Admin operations
- `/api/webhooks` - External webhooks
- `/api/dashboard` - Analytics data

### Middleware (`/middleware/`)

#### 1. **auth.js**
- JWT token verification
- User authentication
- Admin role checking

#### 2. **clerkSync.js**
- Clerk webhook handling
- User synchronization
- Profile updates

#### 3. **realtime.js**
- Socket.io configuration
- Real-time seat updates
- Connection management

### Services (`/services/`)

#### 1. **emailService.js**
- Booking confirmation emails
- Cancellation notifications
- SMTP configuration

#### 2. **userSyncService.js**
- Clerk user synchronization
- Batch user updates
- Profile data mapping

---

## 🎨 Frontend Documentation

### Application Structure (`src/App.js`)
- React Router configuration
- Authentication context
- Socket.io context
- Global styling application
- Route protection
- Admin route handling

### Pages (`/pages/`)

#### User Pages:
1. **Home.js** - Landing page with movie carousels
2. **Movies.js** - Movie listing and search
3. **MovieDetails.js** - Detailed movie information
4. **ShowTimes.js** - Available show times
5. **BookingPage.js** - Seat selection interface
6. **PaymentPage.js** - Payment processing
7. **MyBookings.js** - User booking history
8. **BookingConfirmation.js** - Booking success page
9. **Theaters.js** - Theater listings

#### Admin Pages:
1. **AdminDashboard.js** - Analytics overview
2. **AdminMovies.js** - Movie management
3. **AdminTheaters.js** - Theater management
4. **AdminShows.js** - Show scheduling
5. **AdminBookings.js** - Booking management
6. **AdminUsers.js** - User management

#### Authentication Pages:
1. **ClerkSignIn.js** - User login
2. **ClerkSignUp.js** - User registration
3. **ClerkUserProfile.js** - Profile management

### Components (`/components/`)

#### Common Components:
- **CustomNavbar.js** - Navigation bar
- **ModernLoader.js** - Loading animations
- **MovieCard.js** - Movie display card
- **TrendingCarousel.js** - Movie carousel
- **CitySelector.js** - City selection
- **BrandLogo.js** - Application logo

#### Booking Components:
- **CustomSeatLayout.js** - Interactive seat map
- **ScrollIndicator.js** - Booking progress

#### Admin Components:
- **AdminLayout.js** - Admin page layout
- **AdminSidebar.js** - Admin navigation
- **AdminTable.js** - Data tables
- **SeatLayoutBuilder.js** - Seat configuration

#### Payment Components:
- **StripePayment.js** - Payment form
- **PaymentTest.js** - Payment testing

#### Ticket Components:
- **MovieTicket.js** - Digital ticket display

### Services (`/services/`)

#### API Services:
1. **api.js** - Base API configuration
2. **moviesAPI.js** - Movie-related API calls
3. **showsAPI.js** - Show-related API calls
4. **theatersAPI.js** - Theater-related API calls
5. **clerkService.js** - Clerk authentication
6. **movieService.js** - Movie data processing

### Contexts (`/contexts/`)

#### 1. **AuthContext.js**
- User authentication state
- Login/logout functions
- User profile management

#### 2. **SocketContext.js**
- Real-time connection
- Seat booking updates
- Live notifications

#### 3. **ClerkProvider.js**
- Clerk authentication wrapper
- User session management

### Styling (`/styles/`)
- **global-enhancements.css** - Global styles
- **home-page.css** - Homepage specific styles
- **admin-*.css** - Admin panel styles
- **seat-layout.css** - Seat selection styles
- **responsive-navbar.css** - Navigation styles

---

## 🗄 Database Schema

### Collections:

1. **movies** - Movie information and metadata
2. **theaters** - Theater details and screen configuration
3. **shows** - Show schedules and availability
4. **bookings** - User bookings and transactions
5. **users** - User profiles and preferences
6. **ratings** - Movie ratings and reviews

### Relationships:
- Shows reference Movies and Theaters
- Bookings reference Shows and Users
- Ratings reference Movies and Users

---

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/login          - User login
POST /api/auth/register       - User registration
POST /api/auth/logout         - User logout
GET  /api/auth/profile        - Get user profile
```

### Movies
```
GET    /api/movies            - Get all movies
GET    /api/movies/:id        - Get movie by ID
POST   /api/movies            - Create movie (Admin)
PUT    /api/movies/:id        - Update movie (Admin)
DELETE /api/movies/:id        - Delete movie (Admin)
```

### Theaters
```
GET    /api/theaters          - Get all theaters
GET    /api/theaters/:id      - Get theater by ID
POST   /api/theaters          - Create theater (Admin)
PUT    /api/theaters/:id      - Update theater (Admin)
DELETE /api/theaters/:id      - Delete theater (Admin)
```

### Shows
```
GET    /api/shows             - Get all shows
GET    /api/shows/movie/:id   - Get shows by movie
GET    /api/shows/theater/:id - Get shows by theater
POST   /api/shows             - Create show (Admin)
PUT    /api/shows/:id         - Update show (Admin)
DELETE /api/shows/:id         - Delete show (Admin)
```

### Bookings
```
GET    /api/bookings          - Get user bookings
GET    /api/bookings/:id      - Get booking by ID
POST   /api/bookings          - Create booking
PUT    /api/bookings/:id      - Update booking
DELETE /api/bookings/:id      - Cancel booking
```

### Payment
```
POST   /api/payment/create-intent    - Create payment intent
POST   /api/payment/confirm          - Confirm payment
POST   /api/payment/webhook          - Stripe webhook
```

### Admin
```
GET    /api/admin/dashboard          - Dashboard analytics
GET    /api/admin/users              - All users
GET    /api/admin/bookings           - All bookings
POST   /api/admin/cleanup            - Run cleanup
```

---

## 🔐 Authentication & Authorization

### Clerk Integration
- **Frontend**: `@clerk/clerk-react` for UI components
- **Backend**: `@clerk/clerk-sdk-node` for user verification
- **Webhooks**: User synchronization between Clerk and MongoDB

### User Roles
- **User**: Can browse movies, book tickets, view bookings
- **Admin**: Full access to management features

### Protected Routes
- Booking pages require authentication
- Admin pages require admin role
- Payment pages require user authentication

---

## ✨ Features & Functionality

### User Features
1. **Movie Browsing**
   - View current and upcoming movies
   - Search and filter movies
   - View movie details, cast, and trailers

2. **Theater Selection**
   - Browse theaters by location
   - View theater amenities and facilities
   - Check available screens and showtimes

3. **Seat Booking**
   - Interactive seat map
   - Real-time seat availability
   - Multiple seat selection
   - Seat conflict prevention

4. **Payment Processing**
   - Stripe integration
   - Secure payment handling
   - Payment confirmation
   - Receipt generation

5. **Booking Management**
   - View booking history
   - Download digital tickets
   - Cancel bookings
   - Refund processing

### Admin Features
1. **Movie Management**
   - Add/edit/delete movies
   - Upload movie posters
   - Set release dates and pricing
   - Manage movie status

2. **Theater Management**
   - Add/edit theaters
   - Configure screens and seating
   - Set pricing and amenities
   - Manage theater status

3. **Show Scheduling**
   - Create show schedules
   - Set showtimes and pricing
   - Manage seat availability
   - Auto-cleanup expired shows

4. **Booking Analytics**
   - View all bookings
   - Revenue tracking
   - User analytics
   - Performance metrics

5. **User Management**
   - View all users
   - Manage user roles
   - User activity tracking
   - Account management

### System Features
1. **Real-time Updates**
   - Live seat availability
   - Instant booking updates
   - Real-time notifications

2. **Automated Cleanup**
   - Remove expired shows
   - Deactivate old movies
   - Clean up unused data

3. **Email Notifications**
   - Booking confirmations
   - Cancellation notices
   - Promotional emails

4. **Responsive Design**
   - Mobile-friendly interface
   - Touch-optimized controls
   - Adaptive layouts

---

## 📂 File Organization

### Backend Files by Category

#### Core Server Files
- `server.js` - Main application entry point
- `package.json` - Dependencies and scripts

#### Configuration
- `config/multer.js` - File upload configuration
- `.env` - Environment variables

#### Business Logic
- `controllers/` - All business logic controllers
- `functions/userFunctions.js` - User utility functions

#### Data Layer
- `models/` - MongoDB schemas and models
- Database connection in `server.js`

#### API Layer
- `routes/` - All API endpoint definitions
- `middleware/` - Authentication and validation

#### External Services
- `services/emailService.js` - Email functionality
- `services/userSyncService.js` - Clerk synchronization

### Frontend Files by Category

#### Core Application
- `src/App.js` - Main application component
- `src/index.js` - Application entry point
- `public/index.html` - HTML template

#### User Interface
- `src/pages/` - All page components
- `src/components/` - Reusable UI components

#### State Management
- `src/contexts/` - React context providers
- `src/hooks/` - Custom React hooks

#### External Communication
- `src/services/` - API service functions
- Axios configuration for HTTP requests

#### Styling
- `src/styles/` - CSS files
- Component-specific CSS files

#### Utilities
- `src/utils/` - Helper functions
- Image processing and formatting

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (>=18.0.0)
- MongoDB database
- Clerk account for authentication
- Stripe account for payments

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure environment variables
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure environment variables
npm start
```

### Environment Variables

#### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/bookmycinema
JWT_SECRET=your_jwt_secret
CLERK_SECRET_KEY=your_clerk_secret
STRIPE_SECRET_KEY=your_stripe_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
PORT=5000
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

---

## 🌐 Deployment

### Backend Deployment (Render/Railway)
1. Connect GitHub repository
2. Set environment variables
3. Configure build command: `npm install`
4. Set start command: `npm start`

### Frontend Deployment (Vercel/Netlify)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure environment variables

### Database (MongoDB Atlas)
1. Create MongoDB Atlas cluster
2. Configure network access
3. Update connection string in backend

---

## 📝 Additional Notes

### Performance Optimizations
- Image optimization and lazy loading
- API response caching
- Database indexing
- Code splitting in React

### Security Measures
- JWT token authentication
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Secure payment processing

### Monitoring & Logging
- Error logging and tracking
- Performance monitoring
- User activity logging
- Payment transaction logs

### Future Enhancements
- Mobile app development
- Advanced analytics dashboard
- Loyalty program integration
- Social media integration
- Multi-language support

---

This documentation provides a comprehensive overview of the BookMyCinema project structure, functionality, and implementation details. For specific implementation questions or troubleshooting, refer to the individual component files and their inline documentation.