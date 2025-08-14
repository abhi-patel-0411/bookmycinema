  # Clerk Authentication Setup Documentation

## 📋 Table of Contents
1. [What is Clerk](#what-is-clerk)
2. [Clerk Account Setup](#clerk-account-setup)
3. [Environment Configuration](#environment-configuration)
4. [Frontend Integration](#frontend-integration)
5. [Backend Integration](#backend-integration)
6. [File Structure & Implementation](#file-structure--implementation)
7. [How Clerk Works](#how-clerk-works)
8. [User Synchronization](#user-synchronization)
9. [Protected Routes](#protected-routes)
10. [Troubleshooting](#troubleshooting)

---

## 🔐 What is Clerk

### Overview
Clerk is a **complete authentication and user management solution** that provides:
- **Secure authentication** (email/password, social logins)
- **User management** (profiles, sessions, roles)
- **Pre-built UI components** (sign-in, sign-up forms)
- **Webhook integration** for user synchronization
- **JWT token management** for API security

### Why Clerk for BookMyCinema?
- ✅ **Easy integration** with React and Node.js
- ✅ **Secure by default** with industry standards
- ✅ **Pre-built components** reduce development time
- ✅ **Webhook support** for user data synchronization
- ✅ **Role management** for admin/user permissions

---

## 🚀 Clerk Account Setup

### Step 1: Create Clerk Account
1. Go to [clerk.com](https://clerk.com)
2. Sign up for free account
3. Verify email address
4. Create new application

### Step 2: Application Configuration
```
Application Name: BookMyCinema
Application Type: React (SPA)
Authentication Methods:
  ✅ Email & Password
  ✅ Google OAuth (optional)
  ✅ GitHub OAuth (optional)
```

### Step 3: Get API Keys
```
Frontend API Key: pk_test_xxxxxxxxxx (Publishable Key)
Backend API Key: sk_test_xxxxxxxxxx (Secret Key)
Webhook Signing Secret: whsec_xxxxxxxxxx
```

### Step 4: Configure Domains
```
Development: http://localhost:3000
Production: https://your-domain.com
```

---

## 🔧 Environment Configuration

### Frontend Environment Variables
**File: `frontend/.env`**
```env
# Clerk Configuration
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Optional: Custom domain
REACT_APP_CLERK_FRONTEND_API=https://your-app.clerk.accounts.dev
```

### Backend Environment Variables
**File: `backend/.env`**
```env
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_CjubJWqyHxcBKej35QhdPDgiio5owggIdi7aAMFPmq
CLERK_WEBHOOK_SECRET=whsec_cgZk+8ZgHfpxQdxNFf9cdS4eGrY+HOjW

# Frontend Clerk Key (for reference)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_bWFqb3ItdXJjaGluLTYwLmNsZXJrLmFjY291bnRzLmRldiQ
```

### Environment Files Structure
```
frontend/
├── .env                    # Development environment
├── .env.local             # Local overrides
├── .env.production        # Production environment
└── .env.development       # Development specific

backend/
├── .env                   # Development environment
├── .env.production        # Production environment
└── .env.example          # Template file
```

---

## 🎨 Frontend Integration

### 1. Install Clerk React Package
```bash
cd frontend
npm install @clerk/clerk-react
```

### 2. Main Clerk Provider Setup
**File: `frontend/src/contexts/ClerkProvider.js`**
```javascript
import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const ClerkProviderWrapper = ({ children }) => {
  const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

  if (!clerkPubKey) {
    throw new Error('Missing Clerk Publishable Key');
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      navigate={(to) => window.location.href = to}
    >
      {children}
    </ClerkProvider>
  );
};

export default ClerkProviderWrapper;
```

### 3. App.js Integration
**File: `frontend/src/App.js`**
```javascript
import ClerkProviderWrapper from './contexts/ClerkProvider';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

function App() {
  return (
    <ClerkProviderWrapper>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <AppContent />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ClerkProviderWrapper>
  );
}
```

### 4. Sign In Page
**File: `frontend/src/pages/ClerkSignIn.js`**
```javascript
import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const ClerkSignIn = () => {
  return (
    <div className="auth-container">
      <SignIn 
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        redirectUrl="/"
        appearance={{
          elements: {
            formButtonPrimary: 'btn btn-primary',
            card: 'auth-card'
          }
        }}
      />
    </div>
  );
};

export default ClerkSignIn;
```

### 5. Sign Up Page
**File: `frontend/src/pages/ClerkSignUp.js`**
```javascript
import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const ClerkSignUp = () => {
  return (
    <div className="auth-container">
      <SignUp 
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        redirectUrl="/"
        appearance={{
          elements: {
            formButtonPrimary: 'btn btn-primary',
            card: 'auth-card'
          }
        }}
      />
    </div>
  );
};

export default ClerkSignUp;
```

### 6. User Profile Page
**File: `frontend/src/pages/ClerkUserProfile.js`**
```javascript
import React from 'react';
import { UserProfile } from '@clerk/clerk-react';

const ClerkUserProfile = () => {
  return (
    <div className="profile-container">
      <UserProfile 
        path="/clerk-profile"
        routing="path"
        appearance={{
          elements: {
            card: 'profile-card'
          }
        }}
      />
    </div>
  );
};

export default ClerkUserProfile;
```

### 7. Protected Route Component
**File: `frontend/src/components/common/ClerkProtectedRoute.js`**
```javascript
import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import ModernLoader from './ModernLoader';

const ClerkProtectedRoute = ({ children, adminOnly = false }) => {
  const { isLoaded, isSignedIn, user } = useAuth();

  // Show loader while checking auth status
  if (!isLoaded) {
    return <ModernLoader text="Checking authentication..." />;
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Check admin role if required
  if (adminOnly) {
    const userRole = user?.publicMetadata?.role || 'user';
    if (userRole !== 'admin') {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ClerkProtectedRoute;
```

### 8. Auth Context Integration
**File: `frontend/src/contexts/AuthContext.js`**
```javascript
import React, { createContext, useContext } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const clerkAuth = useClerkAuth();

  const authValue = {
    user: clerkAuth.user,
    isLoaded: clerkAuth.isLoaded,
    isSignedIn: clerkAuth.isSignedIn,
    loading: !clerkAuth.isLoaded,
    signOut: clerkAuth.signOut
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 🔧 Backend Integration

### 1. Install Clerk Node.js SDK
```bash
cd backend
npm install @clerk/clerk-sdk-node
```

### 2. Clerk Service Setup
**File: `backend/services/clerkService.js`**
```javascript
const { clerkClient } = require('@clerk/clerk-sdk-node');

class ClerkService {
  static async getUserById(userId) {
    try {
      const user = await clerkClient.users.getUser(userId);
      return user;
    } catch (error) {
      console.error('Error fetching user from Clerk:', error);
      return null;
    }
  }

  static async getAllUsers() {
    try {
      const users = await clerkClient.users.getUserList();
      return users;
    } catch (error) {
      console.error('Error fetching users from Clerk:', error);
      return [];
    }
  }

  static async updateUserMetadata(userId, metadata) {
    try {
      const user = await clerkClient.users.updateUser(userId, {
        publicMetadata: metadata
      });
      return user;
    } catch (error) {
      console.error('Error updating user metadata:', error);
      return null;
    }
  }
}

module.exports = ClerkService;
```

### 3. Authentication Middleware
**File: `backend/middleware/auth.js`**
```javascript
const { verifyToken } = require('@clerk/clerk-sdk-node');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });

    req.user = payload;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { auth, admin };
```

### 4. Enhanced User Synchronization Service
**File: `backend/services/userSyncService.js`**
```javascript
const { createClerkClient } = require('@clerk/clerk-sdk-node');

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
const User = require('../models/User');

/**
 * Enhanced service with automatic cleanup and dynamic sync
 */
class UserSyncService {
  /**
   * Sync all users with automatic cleanup of orphaned users
   * @returns {Promise<Object>} Results including deletions
   */
  static async syncAllUsers() {
    try {
      console.log('🔄 Starting dynamic user sync from Clerk...');
      
      // Get all users from Clerk
      const clerkResponse = await clerkClient.users.getUserList({ limit: 100 });
      const clerkUsers = clerkResponse.data || clerkResponse || [];
      
      // Get all users from database
      const dbUsers = await User.find();
      
      console.log(`👥 Clerk users: ${clerkUsers.length}, 💾 Database users: ${dbUsers.length}`);
      
      // Create maps for quick lookup
      const clerkUserIds = clerkUsers.map(u => u.id);
      const dbUsersByClerkId = {};
      
      dbUsers.forEach(user => {
        if (user.clerkId) dbUsersByClerkId[user.clerkId] = user;
      });
      
      let newUsers = 0;
      let updatedUsers = 0;
      let deletedUsers = 0;
      
      // Sync users from Clerk to database
      for (const clerkUser of clerkUsers) {
        const email = clerkUser.emailAddresses?.[0]?.emailAddress;
        if (!email) continue;
        
        const existingUser = dbUsersByClerkId[clerkUser.id];
        
        if (existingUser) {
          // Update existing user role if changed
          const role = clerkUser.publicMetadata?.role || existingUser.role || 'user';
          if (existingUser.role !== role) {
            existingUser.role = role;
            await existingUser.save();
            updatedUsers++;
            console.log(`✅ Updated user role: ${email} → ${role}`);
          }
        } else {
          // Create new user
          const role = clerkUser.publicMetadata?.role || 'user';
          const newUser = new User({
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
            email: email,
            password: 'clerk_managed_' + Math.random().toString(36).substring(2, 15),
            role: role,
            clerkId: clerkUser.id,
            isActive: !clerkUser.banned
          });
          
          await newUser.save();
          newUsers++;
          console.log(`✅ Created new user: ${email} (${role})`);
        }
      }
      
      // AUTOMATIC CLEANUP: Remove orphaned users (exist in database but not in Clerk)
      const orphanUsers = dbUsers.filter(u => u.clerkId && !clerkUserIds.includes(u.clerkId));
      
      for (const orphanUser of orphanUsers) {
        await User.findByIdAndDelete(orphanUser._id);
        deletedUsers++;
        console.log(`🗑️ Removed orphaned user: ${orphanUser.email}`);
      }
      
      console.log(`🎯 Sync complete: +${newUsers} new, ~${updatedUsers} updated, -${deletedUsers} deleted`);
      
      return {
        newUsers,
        updatedUsers,
        deletedUsers,
        total: clerkUsers.length
      };
    } catch (error) {
      console.error('❌ Error syncing users:', error);
      throw error;
    }
  }
}

module.exports = UserSyncService;
```

### 5. Enhanced Webhook Handler
**File: `backend/routes/webhooks.js`**
```javascript
const express = require('express');
const { Webhook } = require('svix');
const User = require('../models/User');

const router = express.Router();

// Clerk webhook handler with real-time user sync
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET not configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    const headers = req.headers;
    const payload = req.body;

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(payload, headers);
    } catch (err) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    const { type, data } = evt;
    console.log('📨 Clerk webhook event:', type);

    // Process webhook events with enhanced handlers
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      default:
        console.log(`ℹ️ Unhandled webhook event: ${type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Enhanced user creation handler
async function handleUserCreated(userData) {
  try {
    const email = userData.email_addresses?.[0]?.email_address;
    if (!email) return;

    const existingUser = await User.findOne({ 
      $or: [{ clerkId: userData.id }, { email: email }]
    });

    if (existingUser) {
      console.log(`✅ User already exists: ${email}`);
      return existingUser;
    }

    const newUser = new User({
      name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || email.split('@')[0],
      email: email,
      password: 'clerk_managed_' + Math.random().toString(36).substring(2, 15),
      role: userData.public_metadata?.role || 'user',
      clerkId: userData.id,
      isActive: true
    });

    await newUser.save();
    console.log(`✅ User created: ${email}`);
    return newUser;
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
}

// Enhanced user update handler
async function handleUserUpdated(userData) {
  try {
    const email = userData.email_addresses?.[0]?.email_address;
    if (!email) return;

    const user = await User.findOne({ clerkId: userData.id });
    if (!user) {
      console.log(`🔄 User not found, creating: ${email}`);
      return handleUserCreated(userData);
    }

    user.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || email.split('@')[0];
    user.email = email;
    user.role = userData.public_metadata?.role || user.role;
    user.isActive = !userData.banned;
    user.updatedAt = new Date();

    await user.save();
    console.log(`✅ User updated: ${email}`);
    return user;
  } catch (error) {
    console.error('❌ Error updating user:', error);
  }
}

// Enhanced user deletion handler (PERMANENT DELETE)
async function handleUserDeleted(userData) {
  try {
    const deletedUser = await User.findOneAndDelete({ clerkId: userData.id });
    
    if (deletedUser) {
      console.log(`🗑️ User permanently deleted: ${deletedUser.email} (ID: ${userData.id})`);
      return deletedUser;
    } else {
      console.log(`⚠️ User not found for deletion: ${userData.id}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  }
}

module.exports = router;
```

### 6. User Model
**File: `backend/models/User.js`**
```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  firstName: String,
  lastName: String,
  profileImage: String,
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  lastSignInAt: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
```

---

## 🔄 How Clerk Works

### Authentication Flow
```
1. User visits sign-in page
2. Clerk displays authentication form
3. User enters credentials
4. Clerk validates and creates session
5. JWT token generated and stored
6. User redirected to application
7. Token sent with API requests
8. Backend verifies token with Clerk
```

### Token Management
```javascript
// Frontend: Automatic token handling
const { getToken } = useAuth();
const token = await getToken();

// Backend: Token verification
const payload = await verifyToken(token);
```

### User Synchronization Flow
```
1. User signs up/updates profile in Clerk
2. Clerk sends webhook to backend
3. Backend receives webhook event
4. User data synced to MongoDB
5. Local user profile created/updated
```

---

## 🔐 Protected Routes Implementation

### Frontend Route Protection
**File: `frontend/src/App.js`**
```javascript
// Public routes
<Route path="/" element={<Home />} />
<Route path="/movies" element={<Movies />} />
<Route path="/sign-in/*" element={<ClerkSignIn />} />
<Route path="/sign-up/*" element={<ClerkSignUp />} />

// Protected user routes
<Route 
  path="/my-bookings" 
  element={
    <ClerkProtectedRoute>
      <MyBookings />
    </ClerkProtectedRoute>
  } 
/>

// Protected admin routes
<Route 
  path="/admin/*" 
  element={
    <ClerkProtectedRoute adminOnly>
      <AdminDashboard />
    </ClerkProtectedRoute>
  } 
/>
```

### Backend Route Protection
**File: `backend/routes/bookings.js`**
```javascript
const { auth, admin } = require('../middleware/auth');

// User routes (authentication required)
router.post('/', auth, createBooking);
router.get('/', auth, getUserBookings);

// Admin routes (admin role required)
router.get('/all', auth, admin, getAllBookings);
```

---

## 📁 Complete File Structure

### Frontend Files
```
frontend/src/
├── contexts/
│   ├── ClerkProvider.js          # Main Clerk provider setup
│   └── AuthContext.js            # Auth context integration
├── pages/
│   ├── ClerkSignIn.js            # Sign-in page
│   ├── ClerkSignUp.js            # Sign-up page
│   └── ClerkUserProfile.js       # User profile page
├── components/common/
│   └── ClerkProtectedRoute.js    # Route protection component
└── services/
    └── clerkService.js           # Frontend Clerk utilities
```

### Backend Files
```
backend/
├── services/
│   ├── clerkService.js           # Clerk API interactions
│   └── userSyncService.js        # User synchronization
├── middleware/
│   └── auth.js                   # Authentication middleware
├── models/
│   └── User.js                   # User database model
├── routes/
│   └── webhooks.js               # Clerk webhook handler
└── .env                          # Environment variables
```

---

## 🔧 Configuration Files

### Package.json Dependencies
**Frontend:**
```json
{
  "dependencies": {
    "@clerk/clerk-react": "^5.32.3"
  }
}
```

**Backend:**
```json
{
  "dependencies": {
    "@clerk/clerk-sdk-node": "^5.1.6",
    "svix": "^1.13.0"
  }
}
```

### Environment Variables Summary
```env
# Frontend (.env)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_bWFqb3ItdXJjaGluLTYwLmNsZXJrLmFjY291bnRzLmRldiQ

# Backend (.env)
CLERK_SECRET_KEY=sk_test_CjubJWqyHxcBKej35QhdPDgiio5owggIdi7aAMFPmq
CLERK_WEBHOOK_SECRET=whsec_cgZk+8ZgHfpxQdxNFf9cdS4eGrY+HOjW

# Server Configuration
PORT=5000
MONGODB_URI=mongodb+srv://cinebook-admin:abhipatel0411@cinebook-cluster.6h5h13x.mongodb.net/cinebook?retryWrites=true&w=majority&appName=cinebook-cluster
```

---

## 🚀 Setup Steps Summary

### 1. Clerk Dashboard Setup
- Create account and application
- Configure authentication methods
- Get API keys: `pk_test_xxx` and `sk_test_xxx`
- Set up webhook: `https://your-backend.com/api/webhooks/clerk`
- Subscribe to events: `user.created`, `user.updated`, `user.deleted`
- Copy webhook secret: `whsec_xxx`

### 2. Frontend Integration
- Install @clerk/clerk-react
- Set up ClerkProvider with publishable key
- Create auth pages (sign-in, sign-up, profile)
- Implement protected routes with role checking

### 3. Backend Integration
- Install @clerk/clerk-sdk-node and svix
- Set up authentication middleware
- Create enhanced user synchronization with cleanup
- Handle webhooks with real-time user management

### 4. Dynamic Features
- ✅ Real-time user sync via webhooks
- ✅ Automatic cleanup every 5 minutes
- ✅ Orphaned user removal
- ✅ Role-based access control
- ✅ Permanent user deletion support

### 5. Testing
- Test complete auth flow
- Verify real-time user sync
- Test user deletion from Clerk dashboard
- Check automatic cleanup functionality

---

## 🔍 Troubleshooting

### Common Issues

#### 1. "Missing Clerk Publishable Key"
```javascript
// Check environment variable
console.log(process.env.REACT_APP_CLERK_PUBLISHABLE_KEY);

// Ensure .env file is in frontend root
frontend/.env
```

#### 2. "Invalid Token" Error
```javascript
// Check token format
const token = req.headers.authorization?.replace('Bearer ', '');

// Verify secret key
console.log(process.env.CLERK_SECRET_KEY);
```

#### 3. Webhook Not Working
```javascript
// Check webhook URL in Clerk dashboard
https://your-backend.com/api/webhooks/clerk

// Verify webhook secret
console.log(process.env.CLERK_WEBHOOK_SECRET);
```

#### 4. User Not Syncing
```javascript
// Check webhook events in Clerk dashboard
// Verify user model schema
// Check database connection
```

---

## 📊 Enhanced Clerk Integration Benefits

### For BookMyCinema Project
✅ **Secure Authentication** - Industry-standard security
✅ **Easy Integration** - Pre-built React components
✅ **Dynamic User Management** - Real-time sync with cleanup
✅ **Role-based Access** - Admin/user permissions with auto-update
✅ **Real-time Webhooks** - Instant user synchronization
✅ **Automatic Cleanup** - Orphaned user removal every 5 minutes
✅ **Permanent Deletion** - Delete from Clerk = Delete from database
✅ **Token Management** - JWT handling simplified
✅ **Social Logins** - Google, GitHub integration ready

## 🔄 Current Configuration Status

### Environment Variables (Configured)
```env
CLERK_SECRET_KEY=sk_test_CjubJWqyHxcBKej35QhdPDgiio5owggIdi7aAMFPmq
CLERK_WEBHOOK_SECRET=whsec_cgZk+8ZgHfpxQdxNFf9cdS4eGrY+HOjW
VITE_CLERK_PUBLISHABLE_KEY=pk_test_bWFqb3ItdXJjaGluLTYwLmNsZXJrLmFjY291bnRzLmRldiQ
```

### Webhook Configuration
- **URL**: `https://your-backend.com/api/webhooks/clerk`
- **Events**: `user.created`, `user.updated`, `user.deleted`
- **Status**: ✅ Active with real-time sync

### Automatic Features Active
- 🔄 **User sync every 5 minutes**
- 🗑️ **Automatic orphaned user cleanup**
- ⚡ **Real-time webhook processing**
- 🎯 **Dynamic role management**

This documentation provides complete setup and implementation details for enhanced Clerk authentication with dynamic user management in your BookMyCinema project.