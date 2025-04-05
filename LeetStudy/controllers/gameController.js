const { createGame, addPlayerToGame, getCurrentQuestion, submitAnswer } = require('../models/game');
const { createPlayer } = require('../models/player');
const roundHandler = (req, res, io) => {
    const { gameId } = req.params;
  
    // Get the game instance
    const game = getGame(gameId);
    if (!game || game.players.length === 0) {
      return res.status(404).json({ message: 'Game not found or no players in the game' });
    }
  
    // Start the round
    startRound(gameId, io)
      .then(() => {
        res.status(200).json({ message: 'Round finished' });
      })
      .catch((err) => {
        res.status(500).json({ message: 'Error starting the round', error: err.message });
      });
  };
  const startRound = (gameId, io) => {
    const game = getGame(gameId);
    if (game.roundInProgress) {
      return Promise.reject(new Error('Round already in progress'));
    }
  
    // Mark the round as in progress
    game.roundInProgress = true;
    game.responses = {}; // Reset the responses for the round
    game.answers = []; // Clear any previous answers
    game.currentQuestionIndex = 0; // Start with the first question
  
    // Get the first question
    const question = getCurrentQuestion(gameId);
  
    // Emit the question to all players
    game.players.forEach(player => {
      io.to(player.id).emit('newQuestion', question); // Send the question to each player
    });
  
    return new Promise((resolve, reject) => {
      // Once all players have submitted their answers, proceed to the next question
      game.on('allPlayersAnswered', () => {
        processAnswers(gameId, io).then(resolve).catch(reject);
      });
    });
  };
  const processAnswers = (gameId, io) => {
    const game = getGame(gameId);
    const currentQuestion = getCurrentQuestion(gameId);
  
    // Process each player's answer
    game.players.forEach(player => {
      const playerAnswer = game.responses[player.id];
      const isCorrect = currentQuestion.correctAnswer.toLowerCase() === playerAnswer.toLowerCase();
  
      // Store the answer and whether it was correct
      game.answers.push({
        playerId: player.id,
        answer: playerAnswer,
        correct: isCorrect,
      });
  
      // Emit the result to the player
      io.to(player.id).emit('answerResult', { correct: isCorrect, answer: playerAnswer });
    });
    // Move to the next question
  game.currentQuestionIndex += 1;

  // Reset the responses for the next question
  game.responses = {};

  // If there are more questions, send the next one to players; otherwise, end the round
  const nextQuestion = getCurrentQuestion(gameId);
  if (nextQuestion) {
    game.players.forEach(player => {
      io.to(player.id).emit('newQuestion', nextQuestion); // Send the next question
    });
  } else {
    // If no more questions, end the round
    game.roundInProgress = false;
    io.emit('roundFinished', 'The round has ended!');
  }
};
  
  
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
  