import React, { useEffect } from 'react';
import { ClerkProvider as ClerkProviderOriginal, useUser } from '@clerk/clerk-react';
import api from '../services/api';

// Component to sync user on login/signup
const UserSync = ({ children }) => {
  const { isSignedIn, user } = useUser();
  
  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user && typeof user.getToken === 'function') {
        try {
          // Get token
          const token = await user.getToken();
          
          if (token) {
            // Set token in API
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Sync user with database
            await api.post('/auth/sync-clerk-user');
            console.log('User synced with database');
          }
        } catch (error) {
          // Silently handle sync errors
        }
      }
    };
    
    syncUser();
  }, [isSignedIn, user]);
  
  return <>{children}</>;
};

// Custom Clerk provider with auto-sync
const ClerkProviderWrapper = ({ children }) => {
  // Get publishable key from environment variable
  const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  
  console.log('Using Clerk publishable key:', publishableKey);
  
  return (
    <ClerkProviderOriginal publishableKey={publishableKey}>
      <UserSync>
        {children}
      </UserSync>
    </ClerkProviderOriginal>
  );
};

export default ClerkProviderWrapper;