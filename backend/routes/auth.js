const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { clerkClient } = require('@clerk/express');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role: 'user',
      isActive: true
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync Clerk user to database
router.post('/sync-clerk-user', optionalAuth, async (req, res) => {
  try {
    // If no user in request, return error
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // If user is from database, return it
    if (req.user._id) {
      return res.json({ 
        message: 'User already synced', 
        user: req.user 
      });
    }
    
    // User is from Clerk, sync to database
    const clerkId = req.user.id;
    const email = req.user.email;
    
    if (!email) {
      return res.status(400).json({ message: 'No email found for user' });
    }
    
    // Check if user exists in database
    let dbUser = await User.findOne({ 
      $or: [
        { clerkId },
        { email }
      ]
    });
    
    if (dbUser) {
      // Update clerkId if missing
      if (!dbUser.clerkId) {
        dbUser.clerkId = clerkId;
        await dbUser.save();
      }
      
      return res.json({ 
        message: 'User found and updated', 
        user: dbUser 
      });
    }
    
    // Create new user
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const role = clerkUser.publicMetadata?.role || 'user';
    
    dbUser = new User({
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
      email: email,
      password: 'clerk_managed_' + Math.random().toString(36).substring(2, 15),
      role: role,
      clerkId: clerkId,
      isActive: !clerkUser.banned,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await dbUser.save();
    
    res.json({ 
      message: 'User created', 
      user: dbUser 
    });
  } catch (error) {
    console.error('Sync Clerk user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync all users from Clerk
router.post('/sync-users', auth, async (req, res) => {
  try {
    // Only admins can sync users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const UserSyncService = require('../services/userSyncService');
    const result = await UserSyncService.syncAllUsers();
    
    res.json({ 
      message: 'Users synced successfully', 
      result 
    });
  } catch (error) {
    console.error('Sync users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.post('/update-role', auth, async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    // Only admins can update roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Validate role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Find user in database
    const dbUser = await User.findById(userId);
    
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update role
    dbUser.role = role;
    await dbUser.save();
    
    // If user has clerkId, update in Clerk too
    if (dbUser.clerkId) {
      try {
        await clerkClient.users.updateUser(dbUser.clerkId, {
          publicMetadata: { role }
        });
      } catch (clerkError) {
        console.error('Error updating role in Clerk:', clerkError);
      }
    }
    
    res.json({ 
      message: 'Role updated', 
      user: dbUser 
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;