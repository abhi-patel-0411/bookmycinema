const inngest = require('../inngest');
const User = require('../models/User');

// Function to handle user creation
inngest.createFunction(
  { id: 'sync-clerk-user-created' },
  { event: 'clerk/webhook' },
  async ({ event, step, logger }) => {
    // Only process user.created events
    if (event.data.eventType !== 'user.created') {
      return { status: 'skipped', reason: 'Not a user.created event' };
    }
    
    const userData = event.data;
    
    // Create user in your database
    const result = await step.run('create-user-in-db', async () => {
      const emailObject = userData.email_addresses?.[0];
      const email = emailObject ? emailObject.email_address : null;
      
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { clerkId: userData.id },
          { email: email }
        ]
      });
      
      if (existingUser) {
        console.log(`User already exists: ${email}`);
        return existingUser;
      }
      
      const newUser = new User({
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
        email: email,
        phone: userData.phone_numbers?.[0]?.phone_number || '',
        password: 'clerk_managed', // Placeholder
        role: userData.public_metadata?.role || 'user',
        clerkId: userData.id,
        isActive: true
      });
      
      const savedUser = await newUser.save();
      console.log(`User created: ${email}`);
      return savedUser;
    });
    
    return { status: 'success', user: result };
  }
);

// Function to handle user updates
inngest.createFunction(
  { id: 'sync-clerk-user-updated' },
  { event: 'clerk/webhook' },
  async ({ event, step, logger }) => {
    // Only process user.updated events
    if (event.data.eventType !== 'user.updated') {
      return { status: 'skipped', reason: 'Not a user.updated event' };
    }
    
    const userData = event.data;
    
    // Update user in your database
    const result = await step.run('update-user-in-db', async () => {
      const emailObject = userData.email_addresses?.[0];
      const email = emailObject ? emailObject.email_address : null;
      
      const updatedUser = await User.findOneAndUpdate(
        { clerkId: userData.id },
        {
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
          email: email,
          phone: userData.phone_numbers?.[0]?.phone_number || '',
          role: userData.public_metadata?.role || 'user',
          isActive: !userData.banned
        },
        { new: true, upsert: true }
      );
      
      console.log(`User updated: ${email}`);
      return updatedUser;
    });
    
    return { status: 'success', user: result };
  }
);

// Function to handle user deletion
inngest.createFunction(
  { id: 'sync-clerk-user-deleted' },
  { event: 'clerk/webhook' },
  async ({ event, step, logger }) => {
    // Only process user.deleted events
    if (event.data.eventType !== 'user.deleted') {
      return { status: 'skipped', reason: 'Not a user.deleted event' };
    }
    
    const userData = event.data;
    
    // Deactivate user in your database
    const result = await step.run('deactivate-user-in-db', async () => {
      const updatedUser = await User.findOneAndUpdate(
        { clerkId: userData.id },
        { isActive: false },
        { new: true }
      );
      
      console.log(`User deactivated: ${userData.id}`);
      return updatedUser;
    });
    
    return { status: 'success', user: result };
  }
);

module.exports = inngest;