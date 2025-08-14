const express = require('express');
const { clerkClient } = require('@clerk/express');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Endpoint to manually sync Clerk users
router.post('/sync-clerk-users', adminAuth, async (req, res) => {
  try {
    console.log('Starting Clerk user sync...');
    
    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100,
    });
    
    console.log(`Found ${clerkUsers.length} users in Clerk`);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let googleUsers = 0;
    
    // Process each user
    for (const clerkUser of clerkUsers) {
      try {
        // Get primary email
        const emailObject = clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId) || clerkUser.emailAddresses[0];
        const email = emailObject ? emailObject.emailAddress : null;
        
        if (!email) {
          console.log(`Skipping user ${clerkUser.id} - no email found`);
          skipped++;
          continue;
        }
        
        // Check if user has Google OAuth
        const hasGoogleAuth = clerkUser.externalAccounts && clerkUser.externalAccounts.some(
          account => account.provider === 'google'
        );
        
        if (hasGoogleAuth) {
          console.log(`User ${clerkUser.id} has Google auth`);
          googleUsers++;
        }
        
        // Check if user already exists in our database
        let user = await User.findOne({ 
          $or: [
            { clerkId: clerkUser.id },
            { email: email }
          ]
        });
        
        if (user) {
          // Update existing user
          console.log(`Updating existing user: ${email}`);
          
          user.name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0];
          user.email = email;
          user.clerkId = clerkUser.id;
          user.isActive = !clerkUser.banned;
          user.updatedAt = new Date();
          
          await user.save();
          updated++;
        } else {
          // Create new user
          console.log(`Creating new user: ${email}`);
          
          const newUser = new User({
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
            email: email,
            password: 'clerk_managed_' + Math.random().toString(36).substring(2, 15),
            phone: '',
            role: 'user',
            clerkId: clerkUser.id,
            isActive: !clerkUser.banned,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          await newUser.save();
          created++;
        }
      } catch (userError) {
        console.error(`Error processing user ${clerkUser.id}:`, userError);
        skipped++;
      }
    }
    
    res.json({
      success: true,
      message: 'Clerk user sync completed',
      stats: {
        total: clerkUsers.length,
        created,
        updated,
        skipped,
        googleUsers
      }
    });
  } catch (error) {
    console.error('Error syncing Clerk users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error syncing Clerk users',
      error: error.message
    });
  }
});

// Endpoint to sync a specific user by ID
router.post('/sync-clerk-user/:clerkId', adminAuth, async (req, res) => {
  try {
    const { clerkId } = req.params;
    
    // Get user from Clerk
    const clerkUser = await clerkClient.users.getUser(clerkId);
    
    if (!clerkUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found in Clerk'
      });
    }
    
    const emailObject = clerkUser.emailAddresses[0];
    const email = emailObject ? emailObject.emailAddress : null;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'User has no email address'
      });
    }
    
    // Check if user already exists in our database
    let user = await User.findOne({ 
      $or: [
        { clerkId: clerkUser.id },
        { email: email }
      ]
    });
    
    if (user) {
      // Update existing user
      user.name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0];
      user.email = email;
      user.clerkId = clerkUser.id;
      user.isActive = !clerkUser.banned;
      user.updatedAt = new Date();
      
      await user.save();
      
      res.json({
        success: true,
        message: 'User updated successfully',
        user
      });
    } else {
      // Create new user
      const newUser = new User({
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
        email: email,
        password: 'clerk_managed_' + Math.random().toString(36).substring(2, 15),
        phone: '',
        role: 'user',
        clerkId: clerkUser.id,
        isActive: !clerkUser.banned,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await newUser.save();
      
      res.json({
        success: true,
        message: 'User created successfully',
        user: newUser
      });
    }
  } catch (error) {
    console.error('Error syncing Clerk user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error syncing Clerk user',
      error: error.message
    });
  }
});

module.exports = router;