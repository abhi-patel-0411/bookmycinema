const { clerkClient } = require('@clerk/express');
const User = require('../models/User');

// Middleware to sync Clerk user to database
const syncClerkUser = async (req, res, next) => {
  try {
    // Skip if no auth or no user
    if (!req.auth || !req.auth.userId) {
      return next();
    }

    const clerkUserId = req.auth.userId;
    
    // Check if user exists in database
    let dbUser = await User.findOne({ clerkId: clerkUserId });
    
    if (!dbUser) {
      // User not in database, fetch from Clerk and create
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        
        // Get primary email
        const emailObject = clerkUser.emailAddresses.find(
          email => email.id === clerkUser.primaryEmailAddressId
        ) || clerkUser.emailAddresses[0];
        
        const email = emailObject ? emailObject.emailAddress : null;
        
        if (email) {
          // Check if user exists by email
          dbUser = await User.findOne({ email });
          
          if (dbUser) {
            // Update clerkId if missing
            if (!dbUser.clerkId) {
              dbUser.clerkId = clerkUserId;
              await dbUser.save();
              console.log(`Updated clerkId for user: ${email}`);
            }
          } else {
            // Create new user
            const role = clerkUser.publicMetadata?.role || 'user';
            
            dbUser = new User({
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
              email: email,
              password: 'clerk_managed_' + Math.random().toString(36).substring(2, 15),
              role: role,
              clerkId: clerkUserId,
              isActive: !clerkUser.banned,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            await dbUser.save();
            console.log(`Created new user in database: ${email}`);
          }
        }
      } catch (error) {
        console.error('Error syncing Clerk user:', error);
        // Continue without blocking the request
      }
    }
    
    // Attach user to request
    if (dbUser) {
      req.user = dbUser;
    }
    
    next();
  } catch (error) {
    console.error('Error in syncClerkUser middleware:', error);
    next();
  }
};

module.exports = syncClerkUser;