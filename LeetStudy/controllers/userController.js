const { createPlayer, getPlayerById, addPoints, addHistory } = require('../models/player');

// Create a new player
const createNewPlayer = (req, res) => {
    const { username, ownership = false } = req.body;
    const player = createPlayer(username, ownership);
    res.status(201).json(player);
};

// Get a player by their ID
const getPlayer = (req, res) => {
    const { playerId } = req.params;
    const player = getPlayerById(playerId);
    if (player) {
        res.status(200).json(player);
    } else {
        res.status(404).json({ message: 'Player not found' });
    }
};

// Add points to a player
const updatePlayerPoints = (req, res) => {
    const { playerId, points } = req.body;
    addPoints(playerId, points);
    res.status(200).json({ message: 'Points updated successfully' });
};

// Add game history for a player
const updatePlayerHistory = (req, res) => {
    const { playerId, gameId } = req.body;
    addHistory(playerId, gameId);
    res.status(200).json({ message: 'Game history updated successfully' });
};

module.exports = {
    createNewPlayer,
    getPlayer,
    updatePlayerPoints,
    updatePlayerHistory
};
