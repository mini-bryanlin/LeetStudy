const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Create a new game
router.post('/create', gameController.createNewGame);

// Add a player to a game
router.post('/add-player', gameController.addPlayer);

// Get the current question for a game
router.get('/:gameId/question', gameController.getQuestion);

// Submit an answer for a player
router.post('/submit-answer', gameController.submitPlayerAnswer);



module.exports = router;
