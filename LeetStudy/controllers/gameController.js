const { createGame, addPlayerToGame, getCurrentQuestion, submitAnswer } = require('../models/game');
const { createPlayer } = require('../models/player');

const startGame = (req,res) => {
    const{topic, difficulty,username} = req.body;

    const game = createGame(topic,difficulty,username);
    res.status(200).json({message:"Game created",game});
};
const joinGame = (req, res) => {
    const { gameId } = req.params;
    const { username } = req.body;
  
    // Create a new player
    const player = createPlayer(username,false);
    
    // Add the player to the game
    addPlayerToGame(gameId, player.id);
    
    // Return a success response with the player details
    res.status(200).json({ message: 'Player added to game', player });
  };
  const getQuestion = (req, res) => {
    const { gameId } = req.params;
  
    // Get the current question for the game
    const question = getCurrentQuestion(gameId);
  
    // If the question exists, return it; otherwise, return a message saying no questions are left
    if (question) {
      res.status(200).json({ question });
    } else {
      res.status(404).json({ message: 'No more questions' });
    }
  };
  
  // Controller for submitting an answer to a game
  const answerQuestion = (req, res) => {
    const { gameId } = req.params;
    const { playerId, answer, timeTaken } = req.body;
    
    // Submit the player's answer to the game
    const result = submitAnswer(gameId, playerId, answer, timeTaken);
  
    // Return the result (whether the answer was correct and the next question)
    res.status(200).json(result);
  };
  
  module.exports = { startGame, joinGame, getQuestion, answerQuestion };
  