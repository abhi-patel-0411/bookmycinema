import { useClerk } from '@clerk/clerk-react';
import { useState } from 'react';
import api from './api';

export const useClerkSync = () => {
  const { client } = useClerk();
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [error, setError] = useState(null);

  // Sync all Clerk users to database
  const syncClerkUsers = async () => {
    if (!client || !client.users) {
      const errorMsg = 'Clerk client or users API not available';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setSyncing(true);
    setError(null);

    try {
      // Get all users from Clerk
      const clerkUsers = await client.users.getUserList().catch(err => {
        console.error('Error getting users from Clerk:', err);
        return [];
      });
      
      // Format users for our backend
      const formattedUsers = clerkUsers.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata?.role || 'user',
        banned: user.banned,
        createdAt: user.createdAt
      }));

      // Send to our backend for syncing
      const response = await api.post('/clerk-sync/sync-clerk-users', {
        users: formattedUsers
      });

      setLastSynced(new Date());
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error syncing Clerk users:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncClerkUsers,
    syncing,
    lastSynced,
    error
  };
};

export default useClerkSync;