const { createGame, addPlayerToGame, getCurrentQuestion, submitAnswer, nextQuestion } = require('../models/game');
const { createPlayer } = require('../models/player');

// Create a new game
const createNewGame = (req, res) => {
    const { topic, difficulty, username } = req.body;
    const game = createGame(topic, difficulty, username);
    res.status(201).json(game);
};

// Add a player to the game
const addPlayer = (req, res) => {
    const { gameId, username } = req.body;
    const player = createPlayer(username, false);
    addPlayerToGame(gameId, player.id);
    res.status(200).json({ message: `Player ${username} added to game ${gameId}` });
};

// Get the current question of the game
const getQuestion = (req, res) => {
    const { gameId } = req.params;
    const question = getCurrentQuestion(gameId);
    if (question) {
        res.status(200).json(question);
    } else {
        res.status(404).json({ message: 'Question not found' });
    }
};

// Submit an answer for a player
const submitPlayerAnswer = (req, res) => {
    const { gameId, playerId, answer, timeTaken } = req.body;
    const result = submitAnswer(gameId, playerId, answer, timeTaken);
    res.status(200).json(result);
};



module.exports = {
    createNewGame,
    addPlayer,
    getQuestion,
    submitPlayerAnswer,
}
