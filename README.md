# BookMyCinema - Movie Booking System

A full-stack movie booking application built with React.js, Node.js, Express.js, and MongoDB. Features real-time seat selection, secure payment processing, and comprehensive admin management.

## 🎬 Overview

BookMyCinema is a modern movie ticket booking platform that allows users to browse movies, select seats in real-time, and complete secure bookings. The system includes both user-facing features and comprehensive admin management tools.

## ✨ Key Features

### User Features
- **Movie Browsing**: Browse current movies with detailed information
- **Real-time Seat Selection**: Interactive seat layout with live updates
- **Smart Seat Locking**: 1-minute auto-release prevents indefinite blocking
- **Secure Authentication**: Clerk-based user authentication
- **Payment Integration**: Stripe payment processing
- **Booking Management**: View and manage personal bookings
- **Responsive Design**: Mobile-friendly interface

### Admin Features
- **Movie Management**: Add, edit, and manage movie listings
- **Theater Management**: Configure theaters and screen layouts
- **Show Scheduling**: Create and manage movie showtimes
- **Booking Analytics**: View booking statistics and reports
- **User Management**: Manage user accounts and permissions
- **Real-time Dashboard**: Live updates on bookings and system status

### Technical Features
- **Real-time Updates**: Socket.io for live seat availability
- **Conflict Resolution**: Handles concurrent seat selection
- **Auto-cleanup**: Automatic cleanup of expired seat locks
- **Email Notifications**: Booking confirmation emails
- **Data Persistence**: Robust MongoDB data storage
- **Security**: JWT authentication and input validation

## 🏗️ Architecture

### Frontend (React.js)
```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   ├── booking/        # Seat selection components
│   │   ├── common/         # Shared components
│   │   └── payment/        # Payment components
│   ├── pages/              # Main application pages
│   ├── services/           # API service layers
│   ├── contexts/           # React contexts
│   └── styles/             # CSS styling
```

### Backend (Node.js/Express)
```
backend/
├── controllers/            # Business logic
├── models/                # MongoDB schemas
├── routes/                # API endpoints
├── middleware/            # Authentication & utilities
├── services/              # External services
└── config/                # Configuration files
```

## 🚀 Workflow

### User Booking Flow
1. **Browse Movies** → User views available movies
2. **Select Show** → Choose theater, date, and time
3. **Seat Selection** → Interactive seat layout with real-time updates
4. **Payment** → Secure Stripe payment processing
5. **Confirmation** → Email confirmation and booking details

### Seat Selection Process
1. **User clicks seat** → Immediate UI feedback
2. **Server validation** → Check availability and conflicts
3. **Lock creation** → 1-minute temporary lock
4. **Real-time broadcast** → Notify other users
5. **Auto-release** → Automatic cleanup after timeout

### Admin Management Flow
1. **Movie Setup** → Add movies with details and posters
2. **Theater Configuration** → Define screens and seat layouts
3. **Show Scheduling** → Create showtimes with pricing
4. **Monitoring** → Real-time dashboard and analytics

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation
- **Bootstrap** - UI components
- **Framer Motion** - Animations
- **Clerk** - Authentication
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - Real-time communication
- **Stripe** - Payment processing
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing
- **JWT** - Authentication tokens

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Stripe Account
- Clerk Account
- Email Service (Gmail/SMTP)

## ⚙️ Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd bookmycinema
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Configure environment variables
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Configure environment variables
```

### 4. Environment Configuration

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookmycinema
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

## 🚀 Running the Application

### Development Mode
```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm start
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start backend
cd backend
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Movies
- `GET /api/movies` - Get all movies
- `POST /api/movies` - Create movie (Admin)
- `PUT /api/movies/:id` - Update movie (Admin)
- `DELETE /api/movies/:id` - Delete movie (Admin)

### Shows
- `GET /api/shows` - Get all shows
- `GET /api/shows/:id` - Get show details
- `POST /api/shows` - Create show (Admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `POST /api/bookings/select-seats` - Select seats
- `POST /api/bookings/release-seats` - Release seats

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/users` - User management

## 🔄 Real-time Features

### Seat Selection System
- **Immediate Feedback**: Optimistic UI updates
- **Conflict Prevention**: Server-side validation
- **Auto-release**: 1-minute timeout mechanism
- **Live Updates**: Socket.io broadcasts

### Event Types
- `seats-selected` - User selects seats
- `seats-released` - Seats become available
- `seats-auto-released` - Automatic timeout release
- `seats-booked` - Successful booking completion

## 🔒 Security Features

- **Authentication**: Clerk-based secure authentication
- **Authorization**: Role-based access control
- **Input Validation**: Server-side data validation
- **Password Security**: bcrypt hashing
- **Payment Security**: Stripe secure processing
- **CORS Protection**: Configured cross-origin policies

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Responsive layouts
- **Desktop Enhanced**: Full-featured desktop experience
- **Touch Friendly**: Mobile-optimized interactions

## 🎯 Key Algorithms

### Seat Locking Algorithm
1. **Optimistic Locking**: Immediate UI feedback
2. **Server Validation**: Conflict detection
3. **TTL Management**: MongoDB TTL indexes
4. **Cleanup Process**: Periodic expired lock removal

### Conflict Resolution
1. **First-Come-First-Served**: Timestamp-based priority
2. **Graceful Degradation**: User-friendly error messages
3. **Automatic Recovery**: Self-healing mechanisms

## 📈 Performance Optimizations

- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Strategic data caching
- **Lazy Loading**: Component-based code splitting
- **Image Optimization**: Compressed movie posters
- **Real-time Throttling**: Controlled socket emissions

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend Deployment (Render/Heroku)
1. Configure environment variables
2. Set up MongoDB Atlas
3. Deploy backend service
4. Configure domain and SSL

### Frontend Deployment (Vercel/Netlify)
1. Build production bundle
2. Configure environment variables
3. Deploy static files
4. Set up custom domain

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: [your-email@example.com]

## 🙏 Acknowledgments

- React.js community for excellent documentation
- MongoDB for robust database solutions
- Stripe for secure payment processing
- Clerk for authentication services
- Socket.io for real-time capabilities

---

**Built with ❤️ for movie lovers everywhere**