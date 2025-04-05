const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Debug logging - set to false to disable debug logs
const DEBUG = true;

// Debounce times for join/leave events (milliseconds)
const JOIN_DEBOUNCE_TIME = 5000;  // 5 seconds
const LEAVE_DEBOUNCE_TIME = 5000; // 5 seconds

// Keep track of rooms and their users
const rooms = new Map();

// Keep track of users and their sockets (userId -> Set of socketIds)
const userSockets = new Map();

// Keep track of socket connections (socketId -> { userId, roomIds: Set })
const socketConnections = new Map();

// Track recent events to prevent duplicate messages
const recentEvents = new Map();

// Debug logging function
function debugLog(...args) {
  if (DEBUG) {
    console.log('[SocketServer]', ...args);
  }
}

// Function to log events with debouncing
function logEvent(event, key, message) {
  const eventKey = `${event}:${key}`;
  const now = Date.now();
  const lastTime = recentEvents.get(eventKey) || 0;
  
  // Different debounce times for different events
  let debounceTime = 1000; // Default 1 second
  
  if (event.includes('join')) {
    debounceTime = JOIN_DEBOUNCE_TIME;
  } else if (event.includes('leave')) {
    debounceTime = LEAVE_DEBOUNCE_TIME;
  }
  
  if (now - lastTime > debounceTime) {
    console.log(message);
    recentEvents.set(eventKey, now);
    return true;
  }
  return false;
}

// Create HTTP server
const server = http.createServer();

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Helper function to get a room or create it if it doesn't exist
function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    debugLog(`Creating new room: ${roomId}`);
    rooms.set(roomId, {
      users: new Map(), // userId -> { username, joinTime, socketIds: Set }
      progress: new Map(), // userId -> progress data
    });
  }
  return rooms.get(roomId);
}

// Helper function to remove a user from a room
function removeUserFromRoom(roomId, userId) {
  if (!rooms.has(roomId)) return false;
  
  const room = rooms.get(roomId);
  if (!room.users.has(userId)) return false;
  
  debugLog(`Removing user ${userId} from room ${roomId}`);
  
  // Remove user from room users
  room.users.delete(userId);
  
  // Remove user progress data
  room.progress.delete(userId);
  
  // If room is empty, remove it
  if (room.users.size === 0) {
    debugLog(`Room ${roomId} is empty, removing`);
    rooms.delete(roomId);
  }
  
  return true;
}

// Helper function to remove a socket from a user's connections
function removeSocketFromUser(socketId) {
  if (!socketConnections.has(socketId)) return false;
  
  const { userId } = socketConnections.get(socketId);
  
  if (!userSockets.has(userId)) return false;
  
  const socketIds = userSockets.get(userId);
  socketIds.delete(socketId);
  
  // If user has no more sockets, remove from user sockets map
  if (socketIds.size === 0) {
    debugLog(`User ${userId} has no more sockets, removing from userSockets`);
    userSockets.delete(userId);
  }
  
  return true;
}

// Helper function to get formatted room users
function getRoomUsers(roomId) {
  if (!rooms.has(roomId)) return [];
  
  const room = rooms.get(roomId);
  const users = [];
  
  for (const [userId, userInfo] of room.users.entries()) {
    users.push({
      id: userId,
      username: userInfo.username,
      joinTime: userInfo.joinTime,
    });
  }
  
  return users;
}

// Helper function to send room users to all sockets in the room
function sendRoomUsersToRoom(roomId) {
  if (!rooms.has(roomId)) return;
  
  const users = getRoomUsers(roomId);
  debugLog(`Sending ${users.length} room users to room ${roomId}`);
  io.to(roomId).emit('room_users_updated', users);
}

// Helper function to send room users to a specific socket
function sendRoomUsersToSocket(socketId, roomId) {
  if (!rooms.has(roomId)) {
    console.log(`Room ${roomId} not found when sending users to socket ${socketId}`);
    return;
  }
  
  const users = getRoomUsers(roomId);
  console.log(`Sending ${users.length} room users to socket ${socketId}`);
  io.to(socketId).emit('room_users_updated', users);
}

// Helper function to get formatted room progress
function getRoomProgress(roomId) {
  if (!rooms.has(roomId)) return [];
  
  const room = rooms.get(roomId);
  const progress = [];
  
  for (const [userId, progressData] of room.progress.entries()) {
    // Skip users who are not in the room
    if (!room.users.has(userId)) continue;
    
    const userInfo = room.users.get(userId);
    
    progress.push({
      id: userId,
      username: userInfo.username,
      ...progressData
    });
  }
  
  return progress;
}

// Helper function to send room progress to all sockets in the room
function sendRoomProgressToRoom(roomId) {
  if (!rooms.has(roomId)) return;
  
  const progress = getRoomProgress(roomId);
  debugLog(`Sending progress for ${progress.length} users to room ${roomId}`);
  io.to(roomId).emit('room_progress_updated', progress);
}

// Helper function to send room progress to a specific socket
function sendRoomProgressToSocket(socketId, roomId) {
  if (!rooms.has(roomId)) {
    console.log(`Room ${roomId} not found when sending progress to socket ${socketId}`);
    return;
  }
  
  const progress = getRoomProgress(roomId);
  console.log(`Sending progress for ${progress.length} users to socket ${socketId}`);
  io.to(socketId).emit('room_progress_updated', progress);
}

// Helper function to send room updates to a socket (both users and progress)
function sendRoomUpdatesToSocket(socket, roomId) {
  const socketId = typeof socket === 'string' ? socket : socket.id;
  sendRoomUsersToSocket(socketId, roomId);
  sendRoomProgressToSocket(socketId, roomId);
}

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`New socket connection: ${socket.id}`);
  
  // Initialize socket connection info
  socketConnections.set(socket.id, {
    userId: null,
    roomIds: new Set()
  });
  
  // Handle joining a room
  socket.on('join_room', ({ roomId, username }) => {
    if (!roomId || !username) {
      console.log(`Invalid join request from socket ${socket.id}: missing roomId or username`);
      return;
    }
    
    // Generate a unique ID for the user if they don't have one
    let userId = null;
    const socketInfo = socketConnections.get(socket.id);
    
    if (socketInfo && socketInfo.userId) {
      userId = socketInfo.userId;
      console.log(`Using existing user ID ${userId} for ${username}`);
    } else {
      userId = uuidv4();
      console.log(`Generated new user ID ${userId} for ${username}`);
    }
    
    // Get or create the room
    const room = getOrCreateRoom(roomId);
    
    // Check if user is already in the room
    if (room.users.has(userId)) {
      const userInfo = room.users.get(userId);
      
      console.log(`User ${username} (${userId}) is already in room ${roomId}`);
      
      // Update username in case it changed
      userInfo.username = username;
      
      // Add this socket to the user's socket set
      if (!userInfo.socketIds.has(socket.id)) {
        userInfo.socketIds.add(socket.id);
        console.log(`Added socket ${socket.id} to existing user ${userId} in room ${roomId}`);
      }
      
      // Make sure the socket joins the room
      socket.join(roomId);
      
      // Update socket connection info
      if (!socketInfo.roomIds.has(roomId)) {
        socketInfo.roomIds.add(roomId);
      }
      socketInfo.userId = userId;
      
      // Send current room state to this socket
      sendRoomUsersToSocket(socket.id, roomId);
      sendRoomProgressToSocket(socket.id, roomId);
      
      return;
    }
    
    // If this is a new user joining the room
    console.log(`User ${username} (${userId}) joining room ${roomId}`);
    
    // Add user to room with this socket
    room.users.set(userId, {
      username,
      joinTime: Date.now(),
      socketIds: new Set([socket.id])
    });
    
    // Update user-socket mappings
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    
    // Update socket connection info
    socketInfo.userId = userId;
    socketInfo.roomIds.add(roomId);
    
    // Join the socket to the room
    socket.join(roomId);
    
    // Send room updates to all clients
    sendRoomUsersToRoom(roomId);
  });
  
  // Handle leaving a room
  socket.on('leave_room', ({ roomId }) => {
    if (!roomId) return;
    
    const socketInfo = socketConnections.get(socket.id);
    if (!socketInfo || !socketInfo.userId) return;
    
    const { userId } = socketInfo;
    
    // Check if the room exists
    if (!rooms.has(roomId)) return;
    
    // Check if the user is in the room
    const room = rooms.get(roomId);
    if (!room.users.has(userId)) return;
    
    const userInfo = room.users.get(userId);
    const username = userInfo.username;
    
    // Log leave event with debouncing
    logEvent('leave', `${roomId}:${userId}`, `User ${username} (${userId.substring(0, 8)}) left room ${roomId}`);
    
    // Remove the socket from the user's sockets in this room
    userInfo.socketIds.delete(socket.id);
    
    // If the user has no more sockets in this room, remove them from the room
    if (userInfo.socketIds.size === 0) {
      debugLog(`User ${userId} (${username}) has no more sockets in room ${roomId}, removing from room`);
      removeUserFromRoom(roomId, userId);
    }
    
    // Update socket connection info
    socketInfo.roomIds.delete(roomId);
    
    // Leave the socket from the room
    socket.leave(roomId);
    
    // Send room updates to all clients in the room
    sendRoomUsersToRoom(roomId);
  });
  
  // Handle getting room users
  socket.on('get_room_users', ({ roomId }) => {
    if (!roomId) return;
    
    debugLog(`Socket ${socket.id} requested users for room ${roomId}`);
    sendRoomUsersToSocket(socket.id, roomId);
  });
  
  // Handle getting room progress
  socket.on('get_room_progress', ({ roomId }) => {
    if (!roomId) return;
    
    debugLog(`Socket ${socket.id} requested progress for room ${roomId}`);
    sendRoomProgressToSocket(socket.id, roomId);
  });
  
  // Handle updating progress
  socket.on('update_progress', ({ roomId, currentQuestion, completedQuestions, score, completed }) => {
    if (!roomId) return;
    
    const socketInfo = socketConnections.get(socket.id);
    if (!socketInfo || !socketInfo.userId) return;
    
    const { userId } = socketInfo;
    
    // Check if the room exists
    if (!rooms.has(roomId)) return;
    
    // Check if the user is in the room
    const room = rooms.get(roomId);
    if (!room.users.has(userId)) return;
    
    // Update progress data
    room.progress.set(userId, {
      currentQuestion: currentQuestion || 0,
      completedQuestions: completedQuestions || [],
      score: score || 0,
      completed: completed || false
    });
    
    debugLog(`Updated progress for user ${userId} in room ${roomId}`, {
      currentQuestion, completedQuestions, score, completed
    });
    
    // Send room progress to all clients in the room
    sendRoomProgressToRoom(roomId);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    debugLog(`Socket disconnected: ${socket.id}`);
    
    if (!socketConnections.has(socket.id)) {
      debugLog(`No connection info for socket ${socket.id}`);
      return;
    }
    
    const socketInfo = socketConnections.get(socket.id);
    const { userId, roomIds } = socketInfo;
    
    // Remember the disconnect time
    const disconnectTime = Date.now();
    
    // Delay actual removal to allow for reconnections
    setTimeout(() => {
      // Process each room the user was in
      for (const roomId of roomIds) {
        if (!rooms.has(roomId)) continue;
        
        const room = rooms.get(roomId);
        if (!room.users.has(userId)) continue;
        
        const userInfo = room.users.get(userId);
        const username = userInfo.username;
        
        // If the socket is already removed from the user's sockets, skip
        if (!userInfo.socketIds.has(socket.id)) continue;
        
        // Remove the socket from the user's sockets
        userInfo.socketIds.delete(socket.id);
        
        // If the user has no more sockets in this room, remove them from the room
        if (userInfo.socketIds.size === 0) {
          // Log leave event with debouncing
          logEvent('leave', `${roomId}:${userId}`, `User ${username} (${userId?.substring(0, 8)}) disconnected from room ${roomId}`);
          
          debugLog(`User ${userId} (${username}) has no more sockets in room ${roomId}, removing from room`);
          removeUserFromRoom(roomId, userId);
          
          // Send room updates to all clients in the room
          sendRoomUsersToRoom(roomId);
        }
      }
      
      // Remove socket from user connections
      removeSocketFromUser(socket.id);
      
      // Remove socket connection info
      socketConnections.delete(socket.id);
      
    }, 15000); // 15 seconds delay before removing user to allow for reconnection
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('===== SOCKET.IO SERVER RESTARTED =====');
  console.log(`Listening for connections on port ${PORT}...`);
}); 