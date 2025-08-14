const jwt = require('jsonwebtoken');
const { verifyToken, clerkClient } = require('@clerk/express');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Try Clerk token first
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
      const clerkUser = await clerkClient.users.getUser(payload.sub);
      
      // Get primary email
      const emailObject = clerkUser.emailAddresses.find(
        email => email.id === clerkUser.primaryEmailAddressId
      ) || clerkUser.emailAddresses[0];
      
      const email = emailObject ? emailObject.emailAddress : null;
      
      // Check if user exists in database
      let dbUser = await User.findOne({ clerkId: clerkUser.id });
      
      if (!dbUser && email) {
        // Check if user exists by email
        dbUser = await User.findOne({ email });
        
        if (dbUser) {
          // Update clerkId if missing
          if (!dbUser.clerkId) {
            dbUser.clerkId = clerkUser.id;
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
            clerkId: clerkUser.id,
            isActive: !clerkUser.banned,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          await dbUser.save();
          console.log(`Created new user in database: ${email}`);
        }
      }
      
      // Use database user if available, otherwise use Clerk user
      if (dbUser) {
        req.user = dbUser;
      } else {
        req.user = {
          id: clerkUser.id,
          email: email,
          role: clerkUser.publicMetadata?.role || 'user',
          publicMetadata: clerkUser.publicMetadata
        };
      }
      
      return next();
    } catch (clerkError) {
      console.log('Clerk auth failed, trying JWT:', clerkError.message);
    }
    
    // Fallback to JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token verification failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Try Clerk token first
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY
        });
        const clerkUser = await clerkClient.users.getUser(payload.sub);
        
        // Get primary email
        const emailObject = clerkUser.emailAddresses.find(
          email => email.id === clerkUser.primaryEmailAddressId
        ) || clerkUser.emailAddresses[0];
        
        const email = emailObject ? emailObject.emailAddress : null;
        
        // Check if user exists in database
        let dbUser = await User.findOne({ clerkId: clerkUser.id });
        
        if (!dbUser && email) {
          // Check if user exists by email
          dbUser = await User.findOne({ email });
          
          if (dbUser) {
            // Update clerkId if missing
            if (!dbUser.clerkId) {
              dbUser.clerkId = clerkUser.id;
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
              clerkId: clerkUser.id,
              isActive: !clerkUser.banned,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            await dbUser.save();
            console.log(`Created new user in database: ${email}`);
          }
        }
        
        // Use database user if available, otherwise use Clerk user
        if (dbUser) {
          req.user = dbUser;
        } else {
          req.user = {
            id: clerkUser.id,
            email: email,
            emailAddresses: clerkUser.emailAddresses,
            role: clerkUser.publicMetadata?.role || 'user',
            publicMetadata: clerkUser.publicMetadata
          };
        }
        
        return next();
      } catch (clerkError) {
        console.log('Clerk optional auth failed, trying JWT:', clerkError.message);
      }
      
      // Fallback to JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
        console.log('JWT optional auth failed:', jwtError.message);
      }
    }
    next();
  } catch (error) {
    // Continue without user for optional auth
    console.log('Optional auth error:', error.message);
    next();
  }
};

const adminAuth = async (req, res, next) => {
  auth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Admin access required' });
    }
  });
};

const clerkAuth = async (req, res, next) => {
  auth(req, res, () => {
    if (req.user && req.user.role === 'clerk') {
      next();
    } else {
      res.status(403).json({ message: 'Clerk access required' });
    }
  });
};

module.exports = { auth, optionalAuth, adminAuth, clerkAuth };