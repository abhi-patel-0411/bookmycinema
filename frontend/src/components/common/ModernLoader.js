import React from 'react';

const ModernLoader = ({ size = 'medium', inline = false }) => {
  const sizes = {
    small: { container: '60px', ring1: '60px', ring2: '40px', core: '20px', particle: '4px' },
    medium: { container: '120px', ring1: '120px', ring2: '80px', core: '40px', particle: '8px' },
    large: { container: '180px', ring1: '180px', ring2: '120px', core: '60px', particle: '12px' }
  };
// container → overall loader space.

// ring1, ring2 → rotating rings.

// core → center glowing circle.

// particle → orbiting small dots.
  const currentSize = sizes[size];

  const containerStyle = inline 
    ? { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }
    : { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1f2025',
        zIndex: 99999
      };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spinLoader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulseCore {
            0%, 100% { 
              transform: scale(1);
              opacity: 0.8;
            }
            50% { 
              transform: scale(1.2);
              opacity: 1;
            }
          }
          
          @keyframes orbitParticles {
            0% { transform: rotate(0deg) translateX(${parseInt(currentSize.container) * 0.33}px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(${parseInt(currentSize.container) * 0.33}px) rotate(-360deg); }
          }
          
          @keyframes fadeInLoader {
            from { opacity: 0; transform: scale(0.5); }
            to { opacity: 1; transform: scale(1); }
          }
          
          @keyframes glowEffect {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(229, 9, 20, 0.4), 0 0 40px rgba(229, 9, 20, 0.2);
            }
            50% { 
              box-shadow: 0 0 30px rgba(229, 9, 20, 0.8), 0 0 60px rgba(229, 9, 20, 0.4);
            }
          }
        `}
      </style>
      
      <div style={{ animation: 'fadeInLoader 0.8s ease-out' }}>
        <div
          className="position-relative d-flex align-items-center justify-content-center"
          style={{
            width: currentSize.container,
            height: currentSize.container
          }}
        >
          {/* Outer Ring */}
          <div
            style={{
              position: 'absolute',
              width: currentSize.ring1,
              height: currentSize.ring1,
              border: '4px solid transparent',
              borderTop: '4px solid #e50914',
              borderRight: '4px solid rgba(229, 9, 20, 0.3)',
              borderRadius: '50%',
              animation: 'spinLoader 2s linear infinite, glowEffect 3s ease-in-out infinite'
            }}
          />

          {/* Middle Ring */}
          <div
            style={{
              position: 'absolute',
              width: currentSize.ring2,
              height: currentSize.ring2,
              border: '3px solid transparent',
              borderBottom: '3px solid #ff4757',
              borderLeft: '3px solid rgba(255, 71, 87, 0.3)',
              borderRadius: '50%',
              animation: 'spinLoader 1.5s linear infinite reverse'
            }}
          />

          {/* Inner Core */}
          <div
            style={{
              width: currentSize.core,
              height: currentSize.core,
              background: 'radial-gradient(circle, #ffffff 20%, #e50914 100%)',
              borderRadius: '50%',
              animation: 'pulseCore 2s ease-in-out infinite',
              boxShadow: '0 0 15px rgba(229, 9, 20, 0.6)'
            }}
          />

          {/* Orbiting Particles */}
          {[0, 90, 180, 270].map((angle, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: currentSize.particle,
                height: currentSize.particle,
                background: `linear-gradient(45deg, #e50914, #ff4757)`,
                borderRadius: '50%',
                animation: `orbitParticles ${3 + i * 0.3}s linear infinite`,
                animationDelay: `${i * 0.2}s`,
                boxShadow: '0 0 10px rgba(229, 9, 20, 0.8)'
              }}
            />
          ))}
        </div>

        {/* Loading Text - only show for non-inline loaders */}
        {!inline && (
          <div
            className="text-center mt-4"
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1.1rem',
              fontWeight: '500',
              fontFamily: 'Poppins, sans-serif',
              letterSpacing: '1px',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.3)'
            }}
          >
            Loading...
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernLoader;