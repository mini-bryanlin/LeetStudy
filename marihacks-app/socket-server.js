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
    console.log(`Creating new room: ${roomId}`);
    rooms.set(roomId, {
      users: new Map(), // userId -> { username, joinTime, socketIds: Set, isOwner }
      progress: new Map(), // userId -> progress data
      textAnswers: new Map(), // questionIndex -> { userId: answer }
      currentQuestion: 0, // Current question index
      skippedQuestions: new Set(), // Set of questionIndexes that were skipped
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
      isOwner: userInfo.isOwner || false
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

// Helper function to get text answers for a room and question
function getRoomTextAnswers(roomId, questionIndex) {
  if (!rooms.has(roomId)) return {};
  
  const room = rooms.get(roomId);
  const allAnswers = {};
  
  // If we don't have this question's answers tracked, return empty
  if (!room.textAnswers.has(questionIndex)) {
    return allAnswers;
  }
  
  const answers = room.textAnswers.get(questionIndex);
  for (const [userId, answer] of Object.entries(answers)) {
    allAnswers[userId] = answer;
  }
  
  return allAnswers;
}

// Helper function to send text answers to a room
function sendRoomTextAnswersToRoom(roomId, questionIndex) {
  if (!rooms.has(roomId)) return;
  
  const answers = getRoomTextAnswers(roomId, questionIndex);
  console.log(`Sending text answers for question ${questionIndex} to room ${roomId}`);
  io.to(roomId).emit('text_answers_updated', answers);
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
  
  // Track recent joins to prevent spam
  const recentJoins = new Map();
  
  // Handle joining a room
  socket.on('join_room', ({ roomId, username }) => {
    if (!roomId || !username) {
      console.log(`Invalid join request from socket ${socket.id}: missing roomId or username`);
      return;
    }
    
    // Prevent rapid rejoins
    const joinKey = `${socket.id}:${roomId}`;
    const now = Date.now();
    const lastJoinTime = recentJoins.get(joinKey) || 0;
    
    if (now - lastJoinTime < 5000) { // 5 second debounce
      console.log(`Ignoring rapid rejoin from socket ${socket.id} to room ${roomId}`);
      return;
    }
    
    recentJoins.set(joinKey, now);
    
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
      
      // Only log the first time or after significant delay
      const lastLog = recentEvents.get(`join:${roomId}:${userId}`) || 0;
      if (now - lastLog > JOIN_DEBOUNCE_TIME) {
        console.log(`User ${username} (${userId}) is already in room ${roomId}`);
        recentEvents.set(`join:${roomId}:${userId}`, now);
      }
      
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
    console.log(`User ${username} (${userId}) joining room ${roomId}, Room size: ${room.users.size}`);
    recentEvents.set(`join:${roomId}:${userId}`, now);
    
    // First user becomes the owner
    const isOwner = room.users.size === 0;
    if (isOwner) {
      console.log(`User ${username} (${userId}) is now the owner of room ${roomId}`);
    }
    
    // Add user to room with this socket
    room.users.set(userId, {
      username,
      joinTime: Date.now(),
      socketIds: new Set([socket.id]),
      isOwner
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
  
  // Handle submitting a text answer
  socket.on('submit_text_answer', ({ roomId, answer, questionIndex }) => {
    if (!roomId || answer === undefined || questionIndex === undefined) return;
    
    const socketInfo = socketConnections.get(socket.id);
    if (!socketInfo || !socketInfo.userId) return;
    
    const { userId } = socketInfo;
    
    // Check if the room exists
    if (!rooms.has(roomId)) return;
    
    // Check if the user is in the room
    const room = rooms.get(roomId);
    if (!room.users.has(userId)) return;
    
    // Initialize answers map for this question if it doesn't exist
    if (!room.textAnswers.has(questionIndex)) {
      room.textAnswers.set(questionIndex, {});
    }
    
    // Store the answer
    const answers = room.textAnswers.get(questionIndex);
    answers[userId] = answer;
    
    console.log(`User ${userId} submitted answer for question ${questionIndex} in room ${roomId}`);
    
    // Send updated answers to all users in the room
    sendRoomTextAnswersToRoom(roomId, questionIndex);
    
    // Check if all users have answered
    const answeredCount = Object.keys(answers).length;
    const userCount = room.users.size;
    
    if (answeredCount >= userCount) {
      console.log(`All users (${userCount}/${userCount}) have answered question ${questionIndex} in room ${roomId}`);
      io.to(roomId).emit('all_answers_submitted', { 
        questionIndex,
        answers
      });
    } else {
      console.log(`${answeredCount}/${userCount} users have answered question ${questionIndex} in room ${roomId}`);
    }
  });
  
  // Handle skipping a question (only owner can do this)
  socket.on('skip_question', ({ roomId, questionIndex }) => {
    if (!roomId) return;
    
    const socketInfo = socketConnections.get(socket.id);
    if (!socketInfo || !socketInfo.userId) return;
    
    const { userId } = socketInfo;
    
    // Check if the room exists
    if (!rooms.has(roomId)) return;
    
    // Check if the user is in the room and is the owner
    const room = rooms.get(roomId);
    if (!room.users.has(userId)) return;
    
    const userInfo = room.users.get(userId);
    if (!userInfo.isOwner) {
      console.log(`User ${userId} tried to skip question but is not the owner of room ${roomId}`);
      return;
    }
    
    // Mark question as skipped
    if (questionIndex !== undefined) {
      room.skippedQuestions.add(questionIndex);
    } else if (room.currentQuestion !== undefined) {
      room.skippedQuestions.add(room.currentQuestion);
    }
    
    console.log(`Question ${questionIndex || room.currentQuestion} skipped in room ${roomId} by owner ${userId}`);
    
    // Notify all users in the room
    io.to(roomId).emit('question_skipped', { 
      questionIndex: questionIndex || room.currentQuestion
    });
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
const PORT = 3031;
server.listen(PORT, () => {
  console.log('===== SOCKET.IO SERVER RESTARTED =====');
  console.log(`Socket.io server running on port ${PORT}`);
}); 