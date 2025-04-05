const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const gameRoutes = require('./routes/gameRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Attach Socket.IO to the server

app.use(express.json()); // Middleware to parse JSON request bodies
app.use('/api/games', gameRoutes); // Game routes

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
