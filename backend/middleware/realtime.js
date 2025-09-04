const socketIO = require('socket.io');

let io;
// Map to store user ID to socket ID mapping
const userSocketMap = new Map();

const initializeSocket = (server) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.FRONTEND_URL,
    "https://your-movie-booking-app.vercel.app",
    "https://movie-booking-app.vercel.app",
    /\.vercel\.app$/,
  ].filter(Boolean);

  // new instent 
  io = socketIO(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔗 New client connected:', socket.id);
    
    // Register user ID when they connect
    socket.on('register-user', (userId) => {
      if (userId) {
        // Clear any existing mapping for this user
        const existingSocketId = userSocketMap.get(userId);
        if (existingSocketId && existingSocketId !== socket.id) {
          console.log(`🔄 User ${userId} reconnecting, clearing old socket ${existingSocketId}`);
        }
        
        userSocketMap.set(userId, socket.id);
        socket.userId = userId; // Store userId on socket for easy access
        console.log(`👤 User ${userId} registered with socket ${socket.id}`);
      }
    });
    
    // Remove the infinite seat-status-sync event

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
      
      // Find and remove user from mapping
      let disconnectedUserId = socket.userId;
      
      if (!disconnectedUserId) {
        // Fallback: search through the map
        for (const [userId, socketId] of userSocketMap.entries()) {
          if (socketId === socket.id) {
            disconnectedUserId = userId;
            break;
          }
        }
      }
      
      if (disconnectedUserId) {
        userSocketMap.delete(disconnectedUserId);
        console.log(`👤 User ${disconnectedUserId} unregistered`);
        
        // Clear seat locks for disconnected user
        (async () => {
          try {
            const { clearUserLocks } = require('../controllers/bookingController');
            await clearUserLocks(disconnectedUserId);
          } catch (error) {
            console.error('❌ Error clearing locks:', error.message);
          }
        })();
      }
    });
  });

  return io;
};

const emitToUsers = (event, data) => {
  try {
    if (io && io.emit) {
      io.emit(event, data);
      console.log(`📡 Real-time event emitted to all users: ${event}`);
    } else {
      console.log('⚠️ Socket.io not initialized, skipping real-time emit');
    }
  } catch (error) {
    console.error('❌ Real-time emit error:', error.message);
  }
};

const emitToUser = (userId, event, data) => {
  try {
    if (io && io.to && userId) {
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        io.to(socketId).emit(event, data);
        console.log(`🎯 Real-time event emitted to user ${userId}: ${event}`);
        return true;
      } else {
        console.log(`⚠️ User ${userId} not connected, couldn't emit ${event}`);
        return false;
      }
    } else {
      console.log('⚠️ Socket.io not initialized or missing userId, skipping targeted emit');
      return false;
    }
  } catch (error) {
    console.error('❌ Targeted emit error:', error.message);
    return false;
  }
};

const emitToAdmin = (event, data) => {
  try {
    if (io && io.emit) {
      io.emit(event, data);
      console.log(`👑 Admin event emitted: ${event}`);
    } else {
      console.log('⚠️ Socket.io not initialized, skipping admin emit');
    }
  } catch (error) {
    console.error('❌ Admin emit error:', error.message);
  }
};

module.exports = {
  initializeSocket,
  emitToUsers,
  emitToUser,
  emitToAdmin
};