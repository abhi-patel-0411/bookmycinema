import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { userId, isSignedIn } = useAuth();

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000');
    
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
      
      // Register user ID with socket server when connected
      if (isSignedIn && userId) {
        socketInstance.emit('register-user', userId);
        console.log('Registered user ID with socket server:', userId);
      }
    });
    
    // Re-register user ID if auth state changes
    if (isSignedIn && userId && connected && socket) {
      socket.emit('register-user', userId);
      console.log('Re-registered user ID with socket server:', userId);
    }

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketInstance.on('movie-added', (movie) => {
      window.dispatchEvent(new CustomEvent('movies-updated'));
    });

    socketInstance.on('movie-updated', (movie) => {
      window.dispatchEvent(new CustomEvent('movies-updated'));
    });

    socketInstance.on('movie-deleted', (data) => {
      window.dispatchEvent(new CustomEvent('movies-updated'));
    });

    socketInstance.on('show-added', (show) => {
      window.dispatchEvent(new CustomEvent('shows-updated'));
    });

    socketInstance.on('show-updated', (show) => {
      window.dispatchEvent(new CustomEvent('shows-updated'));
    });

    socketInstance.on('show-deleted', (data) => {
      window.dispatchEvent(new CustomEvent('shows-updated'));
    });

    socketInstance.on('theater-added', (theater) => {
      window.dispatchEvent(new CustomEvent('theaters-updated'));
    });

    socketInstance.on('theater-updated', (theater) => {
      window.dispatchEvent(new CustomEvent('theaters-updated'));
    });

    socketInstance.on('theater-deleted', (data) => {
      window.dispatchEvent(new CustomEvent('theaters-updated'));
    });

    // Seat booking events
    socketInstance.on('seat-conflict', (data) => {
      // Only handle this event if it's meant for this user
      if (data.userId === userId) {
        window.dispatchEvent(new CustomEvent('seat-conflict', { detail: data }));
        console.log('Received seat conflict notification for this user:', data);
      }
    });
    
    socketInstance.on('seats-auto-released', (data) => {
      // Only handle this event if it's meant for this user
      if (!data.userId || data.userId === userId) {
        window.dispatchEvent(new CustomEvent('seats-auto-released', { detail: data }));
        console.log('Seats auto-released for this user:', data);
      }
    });
    
    socketInstance.on('seats-available', (data) => {
      window.dispatchEvent(new CustomEvent('seats-available', { detail: data }));
    });

    socketInstance.on('seats-selected', (data) => {
      window.dispatchEvent(new CustomEvent('seats-selected', { detail: data }));
    });

    socketInstance.on('seats-released', (data) => {
      window.dispatchEvent(new CustomEvent('seats-released', { detail: data }));
    });

    socketInstance.on('seats-booked', (data) => {
      window.dispatchEvent(new CustomEvent('seats-booked', { detail: data }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId, isSignedIn]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;