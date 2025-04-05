const express = require('express');
const { roundHandler, answerQuestion, startGame } = require('../controllers/gameController');
const router = express.Router();

// Route to start a new game (start the game)
router.post('/start', startGame);

// Route to submit an answer for a game
// router.post('/:gameId/answer', answerQuestion);  // Fixed the typo here

module.exports = router;