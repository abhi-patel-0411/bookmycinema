const { createClerkClient } = require('@clerk/express');

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
const User = require('../models/User');

/**
 * Service to sync users from Clerk to the database
 */
class UserSyncService {
  /**
   * Sync all users from Clerk to the database with cleanup
   * @returns {Promise<Object>} Results of the sync operation
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
          // Update existing user
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
      
      // Clean up orphaned users (exist in database but not in Clerk)
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