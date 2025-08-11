import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const customStyles = `
  .cl-internal-1dauvpw { display: none !important; }
  .cl-internal-1hp5nqm { display: none !important; }
  .cl-footer { background: white !important; }
  .cl-rootBox { border-radius: 30px !important;display:flex;justify-contant:center;align-items:center;  }
`;

const ClerkSignIn = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#1f2025',
      position: 'relative'
    }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '2rem',
          left: '2rem',
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <FaArrowLeft size={20} />
      </button>
      
      <style>{customStyles}</style>
      <SignIn 
        routing="path" 
        path="/sign-in" 
        redirectUrl="/"
        signUpUrl="/sign-up"
        appearance={{
          variables: {
            colorPrimary: "#f84565",
            colorBackground: "#ffffff",
            colorInputBackground: "#ffffff",
            colorInputText: "#000000",
            colorText: "#000000",
            colorTextSecondary: "#6b7280",
            colorNeutral: "#000000",
            fontFamily: "'Poppins', sans-serif",
            borderRadius: "8px"
          }
        }}
      />
    </div>
  );
};

export default ClerkSignIn;