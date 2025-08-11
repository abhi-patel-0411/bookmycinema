// import React, { useState, useEffect } from 'react';
// import { FaArrowRight, FaArrowLeft } from 'react-icons/fa';

// const ScrollIndicator = ({ scrollContainerRef }) => {
//   const [showLeftArrow, setShowLeftArrow] = useState(false);
//   const [showRightArrow, setShowRightArrow] = useState(true);

//   const handleScroll = () => {
//     if (!scrollContainerRef.current) return;
    
//     const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
//     // Show left arrow if scrolled to the right
//     setShowLeftArrow(scrollLeft > 20);
    
//     // Show right arrow if not scrolled all the way to the right
//     setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
//   };

//   useEffect(() => {
//     const scrollContainer = scrollContainerRef.current;
//     if (scrollContainer) {
//       scrollContainer.addEventListener('scroll', handleScroll);
      
//       // Check initial state
//       handleScroll();
      
//       return () => {
//         scrollContainer.removeEventListener('scroll', handleScroll);
//       };
//     }
//   }, [scrollContainerRef]);

//   const scrollLeft = () => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
//     }
//   };

//   const scrollRight = () => {
//     if (scrollContainerRef.current) {
//       scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
//     }
//   };

//   return (
//     <>
//       {showLeftArrow && (
//         <button 
//           className="scroll-arrow scroll-arrow-left" 
//           onClick={scrollLeft}
//           aria-label="Scroll left"
//         >
//           <FaArrowLeft />
//         </button>
//       )}
//       {showRightArrow && (
//         <button 
//           className="scroll-arrow scroll-arrow-right" 
//           onClick={scrollRight}
//           aria-label="Scroll right"
//         >
//           <FaArrowRight />
//         </button>
//       )}
//     </>
//   );
// };

// export default ScrollIndicator;