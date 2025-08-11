import { useClerk } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import api from './api';

export const useClerkUsers = () => {
  const { client } = useClerk();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all users from Clerk
  const fetchClerkUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!client) {
        throw new Error('Clerk client not available');
      }

      const users = await client.users.getUserList();
      
      // Map users to a consistent format
      return users.map(user => ({
        id: user.id,
        type: 'clerk',
        displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Unknown',
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata?.role || 'user',
        isActive: !user.banned,
        createdAt: user.createdAt,
        avatar: user.profileImageUrl,
        emailVerified: user.emailAddresses[0]?.verification?.status === 'verified'
      }));
    } catch (err) {
      console.error('Error fetching Clerk users:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update user role in Clerk
  const updateClerkUserRole = async (userId, role) => {
    try {
      if (!client) {
        throw new Error('Clerk client not available');
      }

      // Update role in Clerk
      await client.users.updateUser(userId, {
        publicMetadata: { role }
      });
      
      // Sync with our database
      await api.post('/auth/sync-clerk-user');
      
      return true;
    } catch (err) {
      console.error('Error updating Clerk user role:', err);
      throw err;
    }
  };

  // Ban a user in Clerk
  const banClerkUser = async (userId) => {
    try {
      if (!client) {
        throw new Error('Clerk client not available');
      }

      await client.users.updateUser(userId, {
        banned: true
      });
      
      // Sync with our database
      await api.post('/auth/sync-clerk-user');
      
      return true;
    } catch (err) {
      console.error('Error banning Clerk user:', err);
      throw err;
    }
  };

  // Unban a user in Clerk
  const unbanClerkUser = async (userId) => {
    try {
      if (!client) {
        throw new Error('Clerk client not available');
      }

      await client.users.updateUser(userId, {
        banned: false
      });
      
      // Sync with our database
      await api.post('/auth/sync-clerk-user');
      
      return true;
    } catch (err) {
      console.error('Error unbanning Clerk user:', err);
      throw err;
    }
  };

  return {
    fetchClerkUsers,
    updateClerkUserRole,
    banClerkUser,
    unbanClerkUser,
    loading,
    error
  };
};

// Hook to sync current user with database
export const useSyncCurrentUser = () => {
  const { user } = useClerk();
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!user || synced) return;
      
      setLoading(true);
      try {
        await api.post('/auth/sync-clerk-user');
        setSynced(true);
      } catch (err) {
        console.error('Error syncing user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [user, synced]);

  return { synced, loading, error };
};

export default { useClerkUsers, useSyncCurrentUser };