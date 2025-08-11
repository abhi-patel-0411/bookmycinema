import React from 'react';
import { useUser } from '@clerk/clerk-react';

const ManageAccount = () => {
  const { user } = useUser();

  const handleManageAccount = () => {
    if (user) {
      user.openUserProfile();
    }
  };

  return (
    <button 
      onClick={handleManageAccount}
      className="btn btn-outline-light"
    >
      Manage Account
    </button>
  );
};

export default ManageAccount;