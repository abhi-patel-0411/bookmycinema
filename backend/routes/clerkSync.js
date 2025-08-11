const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');

// Sync users from Clerk to database
router.post('/sync-clerk-users', async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!Array.isArray(users)) {
      return res.status(400).json({ message: 'Users must be an array' });
    }
    
    const results = {
      added: 0,
      updated: 0,
      deleted: 0,
      errors: []
    };
    
    // Process each user from Clerk
    for (const clerkUser of users) {
      try {
        if (!clerkUser.id || !clerkUser.email) {
          results.errors.push(`Invalid user data: ${JSON.stringify(clerkUser)}`);
          continue;
        }
        
        // Check if user exists in database by clerkId
        let user = await User.findOne({ clerkId: clerkUser.id });
        
        if (user) {
          // Update existing user
          user.name = clerkUser.name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
          user.email = clerkUser.email;
          user.isActive = !clerkUser.banned;
          user.role = clerkUser.role || 'user';
          user.updatedAt = new Date();
          
          await user.save();
          results.updated++;
        } else {
          // Check if user exists by email
          user = await User.findOne({ email: clerkUser.email });
          
          if (user) {
            // Update existing user with clerkId
            user.clerkId = clerkUser.id;
            user.name = clerkUser.name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
            user.isActive = !clerkUser.banned;
            user.role = clerkUser.role || 'user';
            user.updatedAt = new Date();
            
            await user.save();
            results.updated++;
          } else {
            // Create new user
            const newUser = new User({
              clerkId: clerkUser.id,
              name: clerkUser.name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
              email: clerkUser.email,
              isActive: !clerkUser.banned,
              role: clerkUser.role || 'user',
              createdAt: new Date(clerkUser.createdAt) || new Date(),
              updatedAt: new Date()
            });
            
            await newUser.save();
            results.added++;
          }
        }
      } catch (error) {
        results.errors.push(`Error processing user ${clerkUser.id}: ${error.message}`);
      }
    }
    
    // Handle deleted users (users in DB with clerkId but not in the provided list)
    if (users.length > 0) {
      const clerkIds = users.map(u => u.id);
      
      // Find users that exist in DB but not in Clerk anymore
      const usersToDelete = await User.find({
        clerkId: { $exists: true, $ne: null },
        clerkId: { $nin: clerkIds }
      });
      
      // Delete these users completely
      if (usersToDelete.length > 0) {
        await User.deleteMany({ _id: { $in: usersToDelete.map(u => u._id) } });
        results.deleted = usersToDelete.length;
      }
    }
    
    res.json({
      message: 'User synchronization completed',
      results
    });
  } catch (error) {
    console.error('Error syncing users:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current user profile from Clerk data
router.get('/me', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Try to find user by clerkId first
    let user = null;
    if (req.user.clerkId) {
      user = await User.findOne({ clerkId: req.user.clerkId });
    }
    
    // If not found, try by email
    if (!user && req.user.email) {
      user = await User.findOne({ email: req.user.email });
      
      // If found by email but no clerkId, update with clerkId
      if (user && req.user.clerkId) {
        user.clerkId = req.user.clerkId;
        await user.save();
      }
    }
    
    // If still not found, create new user
    if (!user && req.user.email) {
      user = new User({
        clerkId: req.user.clerkId,
        name: req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        email: req.user.email,
        role: req.user.role || 'user',
        isActive: true
      });
      
      await user.save();
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;