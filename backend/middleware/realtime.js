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
    console.log('New client connected:', socket.id);
    
    // Register user ID when they connect
    socket.on('register-user', (userId) => {
      if (userId) {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Remove user from mapping when they disconnect
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          console.log(`User ${userId} unregistered`);
          break;
        }
      }
    });
  });

  return io;
};

const emitToUsers = (event, data) => {
  try {
    // io.emit(event, data) sends a message (event) to all connected clients.
    // io is main socket manager 
    if (io && io.emit) {
      io.emit(event, data);
      console.log(`Real-time event emitted to all users: ${event}`);
    } else {
      console.log('Socket.io not initialized, skipping real-time emit');
    }
  } catch (error) {
    console.error('Real-time emit error:', error.message);
  }
};

const emitToUser = (userId, event, data) => {
  try {
    if (io && io.to && userId) {
      const socketId = userSocketMap.get(userId);
      if (socketId) {
        io.to(socketId).emit(event, data);//for 1 user specific
        console.log(`Real-time event emitted to user ${userId}: ${event}`);
        return true;
      } else {
        console.log(`User ${userId} not connected, couldn't emit ${event}`);
        return false;
      }
    } else {
      console.log('Socket.io not initialized or missing userId, skipping targeted emit');
      return false;
    }
  } catch (error) {
    console.error('Targeted emit error:', error.message);
    return false;
  }
};

const emitToAdmin = (event, data) => {
  try {
    if (io && io.emit) {
      io.emit(event, data);
      console.log(`Admin event emitted: ${event}`);
    } else {
      console.log('Socket.io not initialized, skipping admin emit');
    }
  } catch (error) {
    console.error('Admin emit error:', error.message);
  }
};

module.exports = {
  initializeSocket,
  emitToUsers,
  emitToUser,
  emitToAdmin
};