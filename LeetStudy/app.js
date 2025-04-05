// const express = require('express');
// const bodyParser = require('body-parser');
// const gameRoutes = require('./routes/gameRoutes');
// // const playerRoutes = require('./routes/playerRoutes');

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(bodyParser.json());  // Parse incoming JSON requests

// // API Routes
// app.use('/api/games', gameRoutes);
// // app.use('/api/players', playerRoutes);

// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });
const express = require('express');
const bodyParser = require('body-parser');
const {
  createGame,
  addPlayerToGame,
  getGame,
  getCurrentQuestion,
  submitAnswer,
  evaluateAnswer,
} = require('./models/game');
const { createPlayer } = require('./models/player');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Create a new player
app.post('/player', (req, res) => {
  const { username, ownership } = req.body;
  const player = createPlayer(username, ownership);
  res.json(player);
});

// Create a new game
app.post('/game', async (req, res) => {
  const { topic, difficulty, username } = req.body;
  const game = createGame(topic, difficulty, username);
  res.json(game);
});

// Join a game
app.post('/game/:gameId/join', (req, res) => {
  const { playerId } = req.body;
  const result = addPlayerToGame(req.params.gameId, playerId);
  res.json({ message: result });
});

// Get current question
app.get('/game/:gameId/question', (req, res) => {
  const question = getCurrentQuestion(req.params.gameId);
  res.json(question);
});

// Submit an answer
app.post('/game/:gameId/answer', async (req, res) => {
  const { playerId, answer, timeTaken } = req.body;
  try {
    await submitAnswer(req.params.gameId, playerId, answer, timeTaken);
    res.json({ message: 'Answer submitted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

//Evaluate and answer
app.post('/evaluate', async (req, res) => {
    const { question, answer, sampleSolution } = req.body;
  
    if (!question || !answer || !sampleSolution) {
      return res.status(400).json({ error: 'Question, answer or sample solution is missing!' });
    }
  
    try {
      const score = await evaluateAnswer(question, answer, sampleSolution);
      res.json({ score });
    } catch (error) {
      console.error('Evaluation error:', error);
      res.status(500).json({ error: 'Failed to evaluate answer.' });
    }
  });

app.listen(port, () => {
  console.log(`Game server running on http://localhost:${port}`);
});
