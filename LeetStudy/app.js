const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const gameRoutes = require('./routes/gameRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());

