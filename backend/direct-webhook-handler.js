// // Direct webhook handler functions for development mode
// const User = require('./models/User');

// // Handle user created event
// async function handleUserCreated(userData) {
//   try {
//     console.log('Processing user.created event directly');
    
//     const emailObject = userData.email_addresses?.[0];
//     const email = emailObject ? emailObject.email_address : null;
    
//     if (!email) {
//       console.error('No email found in user data');
//       console.log('User data:', JSON.stringify(userData, null, 2));
//       return null;
//     }
    
//     // Check if user already exists
//     const existingUser = await User.findOne({ 
//       $or: [
//         { clerkId: userData.id },
//         { email: email }
//       ]
//     });
    
//     if (existingUser) {
//       console.log(`User already exists: ${email}`);
//       return existingUser;
//     }
    
//     const newUser = new User({
//       name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || email.split('@')[0],
//       email: email,
//       password: 'clerk_managed_' + Math.random().toString(36).substring(2, 15), // Random password
//       role: userData.public_metadata?.role || 'user',
//       clerkId: userData.id,
//       isActive: true
//     });
    
//     const savedUser = await newUser.save();
//     console.log(`User created directly: ${email}`);
//     return savedUser;
//   } catch (error) {
//     console.error('Error handling user created:', error);
//     console.log('Error details:', error.message);
//     if (error.name === 'ValidationError') {
//       console.log('Validation errors:', error.errors);
//     }
//     throw error;
//   }
// }

// // Handle user updated event
// async function handleUserUpdated(userData) {
//   try {
//     console.log('Processing user.updated event directly');
    
//     const emailObject = userData.email_addresses?.[0];
//     const email = emailObject ? emailObject.email_address : null;
    
//     if (!email) {
//       console.error('No email found in user data for update');
//       return null;
//     }
    
//     // First try to find by clerkId
//     let user = await User.findOne({ clerkId: userData.id });
    
//     // If not found, try by email
//     if (!user) {
//       user = await User.findOne({ email: email });
      
//       // If found by email, update the clerkId
//       if (user) {
//         console.log(`User found by email: ${email}, updating clerkId`);
//         user.clerkId = userData.id;
//       }
//     }
    
//     // If still not found, create a new user
//     if (!user) {
//       console.log(`User not found, creating new: ${email}`);
//       return handleUserCreated(userData);
//     }
    
//     // Update user fields
//     user.name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || email.split('@')[0];
//     user.email = email;
//     user.role = userData.public_metadata?.role || user.role || 'user';
//     user.isActive = userData.banned === true ? false : true;
//     user.updatedAt = new Date();
    
//     await user.save();
    
//     console.log(`User updated directly: ${email}`);
//     return user;
//   } catch (error) {
//     console.error('Error handling user updated:', error);
//     console.log('Error details:', error.message);
//     throw error;
//   }
// }

// // Handle user deleted event
// async function handleUserDeleted(userData) {
//   try {
//     console.log('Processing user.deleted event directly');
    
//     const updatedUser = await User.findOneAndUpdate(
//       { clerkId: userData.id },
//       { isActive: false },
//       { new: true }
//     );
    
//     console.log(`User deactivated directly: ${userData.id}`);
//     return updatedUser;
//   } catch (error) {
//     console.error('Error handling user deleted:', error);
//     throw error;
//   }
// }

// module.exports = {
//   handleUserCreated,
//   handleUserUpdated,
//   handleUserDeleted
// };