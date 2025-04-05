const express = require('express');
const bodyParser = require('body-parser');
const gameRoutes = require('./routes/gameRoutes');
// const playerRoutes = require('./routes/playerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());  // Parse incoming JSON requests

// API Routes
app.use('/api/games', gameRoutes);
// app.use('/api/players', playerRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});