import React from 'react';
import { UserProfile } from '@clerk/clerk-react';

const ClerkUserProfile = () => {
  return (
    <UserProfile 
      appearance={{
        elements: {
          footer: { display: 'none' },
          navbarMobileMenuRow: { display: 'none' },
          profileSectionPrimaryButton: { display: 'none' },
          menuButton: { display: 'none' },
          profileSectionPrimaryButton__emailAddresses: { display: 'none' },
          menuButton__connectedAccounts: { display: 'none' }
        }
      }}
    />
  );
};

export default ClerkUserProfile;