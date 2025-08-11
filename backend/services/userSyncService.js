const { clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

/**
 * Service to sync users from Clerk to the database
 */
class UserSyncService {
  /**
   * Sync all users from Clerk to the database
   * @returns {Promise<Object>} Results of the sync operation
   */
  static async syncAllUsers() {
    try {
      console.log('Starting sync of all users from Clerk...');
      
      // Get all users from Clerk
      const clerkUsers = await clerkClient.users.getUserList({
        limit: 100,
      });
      
      console.log(`Found ${clerkUsers.length} users in Clerk`);
      
      // Get all users from database
      const dbUsers = await User.find();
      console.log(`Found ${dbUsers.length} users in database`);
      
      // Create a map of database users by email and clerkId for quick lookup
      const dbUsersByEmail = {};
      const dbUsersByClerkId = {};
      
      dbUsers.forEach(user => {
        if (user.email) dbUsersByEmail[user.email.toLowerCase()] = user;
        if (user.clerkId) dbUsersByClerkId[user.clerkId] = user;
      });
      
      // Find users in Clerk that are not in the database
      let newUsers = 0;
      let updatedUsers = 0;
      
      for (const clerkUser of clerkUsers) {
        // Get primary email
        const emailObject = clerkUser.emailAddresses.find(
          email => email.id === clerkUser.primaryEmailAddressId
        ) || clerkUser.emailAddresses[0];
        
        const email = emailObject ? emailObject.emailAddress : null;
        
        if (!email) {
          console.log(`Skipping user ${clerkUser.id} - no email found`);
          continue;
        }
        
        // Check if user exists in database by clerkId or email
        const existingUserByClerkId = dbUsersByClerkId[clerkUser.id];
        const existingUserByEmail = dbUsersByEmail[email.toLowerCase()];
        
        if (existingUserByClerkId || existingUserByEmail) {
          // User exists, update if needed
          const existingUser = existingUserByClerkId || existingUserByEmail;
          
          // Update clerkId if missing
          if (!existingUser.clerkId) {
            existingUser.clerkId = clerkUser.id;
            await existingUser.save();
            console.log(`Updated clerkId for user: ${email}`);
            updatedUsers++;
          }
        } else {
          // Create new user in database
          console.log(`Creating new user: ${email}`);
          
          // Get role from Clerk metadata or default to 'user'
          const role = clerkUser.publicMetadata?.role || 'user';
          
          const newUser = new User({
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
            email: email,
            password: 'clerk_managed_' + Math.random().toString(36).substring(2, 15),
            role: role,
            clerkId: clerkUser.id,
            isActive: !clerkUser.banned,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          await newUser.save();
          console.log(`Created new user in database: ${email}`);
          newUsers++;
        }
      }
      
      return {
        newUsers,
        updatedUsers,
        total: clerkUsers.length
      };
    } catch (error) {
      console.error('Error syncing users:', error);
      throw error;
    }
  }
}

module.exports = UserSyncService;