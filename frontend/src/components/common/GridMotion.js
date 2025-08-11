import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './GridMotion.css';

const GridMotion = ({ gradientColor = '#1f2025' }) => {
  const gridRef = useRef(null);
  const rowRefs = useRef([]);
  const mouseXRef = useRef(window.innerWidth / 2);

  // Movie poster images from public/images
  const movieImages = [
    '/images/ant man.jpg',
    '/images/avengers.jpg',
    '/images/Bhool-Bhulaiyaa-3.jpg',
    '/images/bhoolbhulaiyaa-3.jpg',
    '/images/captain_america_1.webp',
    '/images/captainbg.jpg',
    '/images/chhaava.jpg',
    '/images/chhaavaticket.jpg',
    '/images/gadar_bg.jpg',
    '/images/Gadar2.jpg',
    '/images/hq720.jpg',
    '/images/jawan.jpg',
    '/images/kgf2.webp',
    '/images/pushpa2.jpg',
    '/images/pushpa2ticket.jpg',
    '/images/pvr4.jpg',
    '/images/rr1.jpg',
    '/images/spiderman.jpg',
    '/images/stree2.webp',
    '/images/ant man.jpg',
    '/images/avengers.jpg',
    '/images/jawan.jpg',
    '/images/kgf2.webp',
    '/images/pushpa2.jpg',
    '/images/spiderman.jpg',
    '/images/stree2.webp',
    '/images/Gadar2.jpg',
    '/images/chhaava.jpg'
  ];

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseXRef.current = e.clientX;
    };

    const updateMotion = () => {
      const maxMoveAmount = 200;
      const baseDuration = 1.2;

      rowRefs.current.forEach((row, index) => {
        if (row) {
          const direction = index % 2 === 0 ? 1 : -1;
          const moveAmount = ((mouseXRef.current / window.innerWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;

          gsap.to(row, {
            x: moveAmount,
            duration: baseDuration,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        }
      });
    };

    const ticker = gsap.ticker.add(updateMotion);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      gsap.ticker.remove(ticker);
    };
  }, []);

  return (
    <div className="grid-motion-wrapper" ref={gridRef}>
      <div 
        className="grid-motion-intro"
        style={{
          background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)`,
        }}
      >
        <div className="grid-motion-container">
          {[...Array(4)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid-motion-row"
              ref={(el) => (rowRefs.current[rowIndex] = el)}
            >
              {[...Array(7)].map((_, itemIndex) => {
                const imageIndex = rowIndex * 7 + itemIndex;
                const imageSrc = movieImages[imageIndex % movieImages.length];
                
                return (
                  <div key={itemIndex} className="grid-motion-item">
                    <div className="grid-motion-item-inner">
                      <div
                        className="grid-motion-item-img"
                        style={{
                          backgroundImage: `url(${imageSrc})`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridMotion;