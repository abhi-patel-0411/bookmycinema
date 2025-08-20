import { useEffect } from 'react';

const useSocketSeatUpdates = (showId, setLockedSeats, setSelectedSeats) => {
  useEffect(() => {
    if (!showId) return;

    // Use existing window event listeners instead of socket.io
    const handleSeatsAutoReleased = (event) => {
      const { showId: eventShowId, seats } = event.detail;
      if (eventShowId === showId) {
        console.log('Seats auto-released via socket:', seats);
        setLockedSeats(prev => prev.filter(seat => !seats.includes(seat)));
      }
    };

    const handleSeatsAvailable = (event) => {
      const { showId: eventShowId, seats } = event.detail;
      if (eventShowId === showId) {
        console.log('Seats now available via socket:', seats);
        setLockedSeats(prev => prev.filter(seat => !seats.includes(seat)));
      }
    };

    // Add event listeners
    window.addEventListener('seats-auto-released', handleSeatsAutoReleased);
    window.addEventListener('seats-available', handleSeatsAvailable);

    return () => {
      window.removeEventListener('seats-auto-released', handleSeatsAutoReleased);
      window.removeEventListener('seats-available', handleSeatsAvailable);
    };
  }, [showId, setLockedSeats, setSelectedSeats]);
};

export default useSocketSeatUpdates;