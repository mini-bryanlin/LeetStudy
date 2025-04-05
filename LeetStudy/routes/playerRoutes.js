const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Create a new player
router.post('/create', playerController.createNewPlayer);

// Get a player by ID
router.get('/:playerId', playerController.getPlayer);

// Update player points
router.post('/update-points', playerController.updatePlayerPoints);

// Update player history
router.post('/update-history', playerController.updatePlayerHistory);

module.exports = router;