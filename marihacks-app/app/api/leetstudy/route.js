import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for LeetStudy games and players
const games = new Map();
const players = new Map();

// Helper function to evaluate an answer
const evaluateAnswer = (question, answer, solutionMethod) => {
  if (answer === solutionMethod) {
    return {score: 100, feedback: "Perfect Answer!"};
  }
  else {
    const random = Math.floor(Math.random() * (80 - 40 + 1)) + 40;
    if (random > 95){
      return {score: random, feedback: "Perfect Answer!"}
    }
    else if (random > 90) {
      return {score: random, feedback: "Great Answer!"}
    }
    else if (random > 80){
      return {score: random, feedback: "Almost there!"}
    }
    else if (random > 60){
      return {score: random, feedback: "Hmm, acceptable answer, but we know you can do better!"}
    }
    else if (random > 40){
      return {score: random, feedback: "Not quite, you should probably review this question."}
    } 
    else {
      return {score: random, feedback: "Unacceptable answer, review this question immediately."}
    }
  }
};

// Generate sample questions
const generateQuestions = (topic, difficulty) => {
  // For now, we'll use sample questions
  const questions = [
    { 
      question: 'What is the time complexity of a standard quicksort algorithm?', 
      correctAnswer: 'O(n log n)', 
      type: 'text' 
    },
    { 
      question: 'Which data structure is most suitable for implementing a priority queue?',
      options: ['Array', 'Linked List', 'Binary Heap', 'Hash Table'],
      correctAnswer: 2,
      type: 'multiple_choice'
    },
    { 
      question: 'What is the capital of France?', 
      correctAnswer: 'Paris', 
      type: 'text' 
    },
  ];
  
  // Filter by topic if provided
  if (topic) {
    // In a real implementation, we would filter based on topic
    console.log(`Filtering by topic: ${topic}`);
  }
  
  // Adjust difficulty if provided
  if (difficulty) {
    console.log(`Adjusting for difficulty: ${difficulty}`);
    // In a real implementation, we would adjust questions based on difficulty
  }
  
  return questions;
};

// Create a new player
const createPlayer = (username, isOwner = false) => {
  const playerId = uuidv4();
  const player = {
    id: playerId,
    username,
    points: 0,
    answers: [],
    history: [],
    isOwner,
    createdAt: new Date()
  };
  
  players.set(playerId, player);
  return player;
};

// Create a new game
const createGame = (topic, difficulty, username, customId = null) => {
  const gameId = customId || uuidv4();
  const owner = createPlayer(username, true);
  
  const game = {
    id: gameId,
    topic,
    difficulty,
    players: [owner.id],
    playerObjects: [owner],
    currentQuestionIndex: 0,
    questions: generateQuestions(topic, difficulty),
    answers: [],
    createdAt: new Date(),
    lastUpdated: new Date()
  };
  
  games.set(gameId, game);
  return { game, owner };
};

// Get a game by ID
const getGame = (gameId) => {
  return games.get(gameId);
};

// Get a player by ID
const getPlayer = (playerId) => {
  return players.get(playerId);
};

// Add a player to a game
const addPlayerToGame = (gameId, username) => {
  const game = getGame(gameId);
  if (!game) {
    return { success: false, message: 'Game not found' };
  }
  
  const player = createPlayer(username);
  game.players.push(player.id);
  game.playerObjects.push(player);
  game.lastUpdated = new Date();
  
  return { success: true, player, message: 'Player added to game' };
};

// Submit an answer
const submitAnswer = (gameId, playerId, answer) => {
  const game = getGame(gameId);
  const player = getPlayer(playerId);
  
  if (!game) {
    return { success: false, message: 'Game not found' };
  }
  
  if (!player) {
    return { success: false, message: 'Player not found' };
  }
  
  if (!game.players.includes(playerId)) {
    return { success: false, message: 'Player not in this game' };
  }
  
  const question = game.questions[game.currentQuestionIndex];
  if (!question) {
    return { success: false, message: 'No current question' };
  }
  
  // Process the answer
  const isMultipleChoice = question.type === 'multiple_choice';
  const correctAnswer = isMultipleChoice ? question.correctAnswer : question.correctAnswer;
  
  // Evaluate the answer
  const evaluation = evaluateAnswer(
    question.question, 
    answer,
    correctAnswer
  );
  
  // Record the answer
  const answerRecord = {
    playerId,
    answer,
    timeTaken: 0, // Would be provided by the client in a real implementation
    score: evaluation.score,
    feedback: evaluation.feedback,
    correct: evaluation.score > 90
  };
  
  game.answers.push(answerRecord);
  player.answers.push(answerRecord);
  player.points += evaluation.score;
  
  // Check if all players have answered
  const allAnswered = game.players.every(pid => 
    game.answers.some(a => a.playerId === pid)
  );
  
  if (allAnswered) {
    // Move to the next question
    game.currentQuestionIndex += 1;
    game.answers = []; // Clear answers for the next question
  }
  
  game.lastUpdated = new Date();
  
  return { 
    success: true, 
    evaluation,
    allAnswered,
    currentQuestionIndex: game.currentQuestionIndex,
    hasMoreQuestions: game.currentQuestionIndex < game.questions.length
  };
};

// API Route handlers
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const gameId = searchParams.get('gameId');
  
  if (action === 'games') {
    // Return list of all games
    return NextResponse.json({
      games: Array.from(games.values()).map(g => ({
        id: g.id,
        topic: g.topic,
        difficulty: g.difficulty,
        playerCount: g.players.length,
        currentQuestionIndex: g.currentQuestionIndex,
        totalQuestions: g.questions.length,
        createdAt: g.createdAt
      }))
    });
  }
  
  if (action === 'game' && gameId) {
    // Return specific game
    const game = getGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    return NextResponse.json({ game });
  }
  
  if (action === 'question' && gameId) {
    // Return current question for a game
    const game = getGame(gameId);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const question = game.questions[game.currentQuestionIndex];
    if (!question) {
      return NextResponse.json({ error: 'No more questions' }, { status: 404 });
    }
    
    // Don't include the correct answer in the response
    const sanitizedQuestion = { ...question };
    delete sanitizedQuestion.correctAnswer;
    
    return NextResponse.json({ 
      question: sanitizedQuestion,
      questionIndex: game.currentQuestionIndex,
      totalQuestions: game.questions.length
    });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, gameId, playerId, username, topic, difficulty, answer } = body;
    
    if (action === 'create_game') {
      // Create a new game
      if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
      }
      
      const { game, owner } = createGame(topic, difficulty, username);
      return NextResponse.json({ 
        game: {
          id: game.id,
          topic: game.topic,
          difficulty: game.difficulty,
          currentQuestionIndex: game.currentQuestionIndex,
          totalQuestions: game.questions.length
        }, 
        player: owner
      });
    }
    
    if (action === 'join_game') {
      // Join an existing game
      if (!gameId || !username) {
        return NextResponse.json({ error: 'Game ID and username are required' }, { status: 400 });
      }
      
      const result = addPlayerToGame(gameId, username);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      
      return NextResponse.json({ 
        message: result.message,
        player: result.player
      });
    }
    
    if (action === 'submit_answer') {
      // Submit an answer to a question
      if (!gameId || !playerId || answer === undefined) {
        return NextResponse.json({ error: 'Game ID, player ID, and answer are required' }, { status: 400 });
      }
      
      const result = submitAnswer(gameId, playerId, answer);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 