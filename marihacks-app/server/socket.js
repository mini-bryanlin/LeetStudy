const { Server } = require('socket.io');

// Map to track active users in each room
const roomUsers = new Map();
// Map to track user progress in each room
const roomProgress = new Map();

// Initialize socket.io server
function initSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? false 
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    // When a user joins a room
    socket.on('join_room', ({ roomId, user }) => {
      // Join the socket.io room
      socket.join(roomId);
      
      // Initialize room data structures if they don't exist
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      if (!roomProgress.has(roomId)) {
        roomProgress.set(roomId, new Map());
      }
      
      // Add user to room
      roomUsers.get(roomId).set(socket.id, {
        id: user.id || socket.id,
        username: user.username || 'Anonymous',
        avatar: user.avatar,
        joinedAt: new Date()
      });
      
      // Initialize user progress
      roomProgress.get(roomId).set(socket.id, {
        id: user.id || socket.id,
        completedQuestions: [],
        currentQuestion: 0,
        score: 0
      });
      
      // Send updated user list to all clients in the room
      const usersInRoom = Array.from(roomUsers.get(roomId).values());
      const progressInRoom = Array.from(roomProgress.get(roomId).values());
      
      io.to(roomId).emit('room_users_updated', { users: usersInRoom });
      io.to(roomId).emit('room_progress_updated', { progress: progressInRoom });
      
      console.log(`User ${user.username || 'Anonymous'} joined room ${roomId}`);
    });
    
    // When a user answers a question
    socket.on('question_answered', ({ roomId, questionIndex, isCorrect }) => {
      // Update user progress
      if (roomProgress.has(roomId) && roomProgress.get(roomId).has(socket.id)) {
        const userProgress = roomProgress.get(roomId).get(socket.id);
        
        if (!userProgress.completedQuestions.includes(questionIndex)) {
          userProgress.completedQuestions.push(questionIndex);
        }
        
        userProgress.currentQuestion = questionIndex + 1;
        
        if (isCorrect) {
          userProgress.score += 1;
        }
        
        // Update the progress map
        roomProgress.get(roomId).set(socket.id, userProgress);
        
        // Send updated progress to all clients in the room
        const progressInRoom = Array.from(roomProgress.get(roomId).values());
        io.to(roomId).emit('room_progress_updated', { progress: progressInRoom });
        
        console.log(`User in room ${roomId} answered question ${questionIndex}, correct: ${isCorrect}`);
      }
    });
    
    // When a user completes the quiz
    socket.on('quiz_completed', ({ roomId, score, totalQuestions }) => {
      if (roomProgress.has(roomId) && roomProgress.get(roomId).has(socket.id)) {
        const userProgress = roomProgress.get(roomId).get(socket.id);
        
        userProgress.score = score;
        userProgress.completed = true;
        
        // Update the progress map
        roomProgress.get(roomId).set(socket.id, userProgress);
        
        // Send updated progress to all clients in the room
        const progressInRoom = Array.from(roomProgress.get(roomId).values());
        io.to(roomId).emit('room_progress_updated', { progress: progressInRoom });
        
        // Also notify about quiz completion
        if (roomUsers.has(roomId) && roomUsers.get(roomId).has(socket.id)) {
          const user = roomUsers.get(roomId).get(socket.id);
          io.to(roomId).emit('user_completed_quiz', {
            username: user.username,
            score,
            totalQuestions
          });
        }
        
        console.log(`User in room ${roomId} completed quiz with score ${score}/${totalQuestions}`);
      }
    });
    
    // When a user disconnects
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      
      // Remove user from all rooms they were in
      for (const [roomId, users] of roomUsers.entries()) {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          console.log(`User removed from room ${roomId}`);
          
          // Remove user progress
          if (roomProgress.has(roomId)) {
            roomProgress.get(roomId).delete(socket.id);
          }
          
          // Send updated user list to all clients in the room
          const usersInRoom = Array.from(users.values());
          io.to(roomId).emit('room_users_updated', { users: usersInRoom });
          
          // Send updated progress to all clients in the room
          if (roomProgress.has(roomId)) {
            const progressInRoom = Array.from(roomProgress.get(roomId).values());
            io.to(roomId).emit('room_progress_updated', { progress: progressInRoom });
          }
        }
      }
    });
  });

  return io;
}

module.exports = { initSocketServer }; 