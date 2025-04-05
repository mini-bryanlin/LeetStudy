const {v4: uuidv4} = require('uuid');
const { createPlayer, getPlayerById, addPoints } = require('./player'); // Import the player model
const games = [];
const dotenv = require('dotenv');
dotenv.config();

const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: "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"
})

const evaluateAnswer = (question, answer, solutionMethod) => {
  if (answer == solutionMethod) {
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
}

// const evaluateAnswer = async (question, answer, solutionMethod) => {
//   const prompt = `
// You are an expert grader. Grade the student's answer based on the following:
// 1. Correctness of the answer.
// 2. Evaluation of the solution method or explanation used to arrive at the answer.
// Grade on a scale of 0 to 100, where:
// - 100 means perfect answer and impeccable method
// - 0 means completely wrong answer and no valid reasoning

// Return only the score followed by feedback. For example:
// Score: 85
// Feedback: The answer was mostly correct but lacked detail in the explanation.

// Question: ${question}
// Student Answer: ${answer}
// Expected Answer / Method: ${solutionMethod}

// Score and Feedback:
// `;

//   try {
//     const response = await openai.chat.completions.create({
//       model: 'gpt-3.5',
//       messages: [{ role: 'user', content: prompt }],
//       temperature: 0,
//       max_tokens: 300,
//     });

//     const result = response.choices[0].message.content.trim();
    
//     const lines = result.split('\n');
//     const scoreLine = lines.find(line => line.toLowerCase().includes('score'));
//     const feedbackLine = lines.find(line => line.toLowerCase().includes('feedback'));

//     let score = parseInt(scoreLine.replace(/\D/g, ''), 10);
//     score = Math.max(0, Math.min(100, score)); // clamp to [0, 100]

//     const feedback = feedbackLine ? feedbackLine.trim() : "No feedback provided.";

//     return { score, feedback };
//   } catch (error) {
//     console.error("Error from OpenAI:", error);
//     return { score: 0, feedback: "Error evaluating answer." };
//   }
// };

const generateQuestions = (topic, difficulty) => {
  
      const response = [
          { question: 'What is the capital of France?', correctAnswer: 'Paris' },
          { question: 'Who wrote "Hamlet"?', correctAnswer: 'Shakespeare' },
          { question: 'What is 2 + 2?', correctAnswer: '4' }
      ]; 
      return response; // Default fallback questions in case of error
  }

const createGame = (topic, difficulty,username,custom_id) =>{
    const game = {
        id: custom_id,
        topic,
        difficulty,
        players: [],
        currentQuestionIndex: 0,
        questions: generateQuestions(topic,difficulty),
        answers:[],
    };
    const player = createPlayer(username,true);
    game.players.push(player.id);
    games.push(game);
    return game;
};


  const addPlayerToGame = (gameId, playerId) =>{
    const game = getGame(gameId);
    const player = getPlayerById(playerId);
    if (game && !game.players.includes(playerId)){
        game.players.push(playerId);
        return 'Player Added'
    }else{
        return 'Player Already in Game'

    }
  };

  const getGame= (gameId) =>{
    return games.find(game => game.id === gameId)
  }

  const getCurrentQuestion = (gameId) =>{
    const game = getGame(gameId);
    if (game){
        return game.questions[game.currentQuestionIndex];

    }
    return null;

  };
 
  const submitAnswer = (gameId, playerId, answer, timeTaken) => {
    const game = getGame(gameId);
    const player = getPlayerById(playerId);
  
    if (game) {
      const question = game.questions[game.currentQuestionIndex];
      if (!question) {
        console.error('No question available at index:', game.currentQuestionIndex);
        return;
      }
      game.answers.push({
        playerId,
        answer,
        timeTaken,
        correct: false, // placeholder; could add logic to update later
      });
  
      try {
        const questionText = question.question;
        const correctAnswer = question.correctAnswer;
        console.log(game.questions, game.currentQuestionIndex, playerId)
        const { score, feedback } = evaluateAnswer(questionText, answer, correctAnswer);
  
        player.answers.push({ answer, score, feedback });
  
        console.log(`Evaluated: ${score} | Feedback: ${feedback}`);
        addPoints(playerId, score);
      } catch (error) {
        console.error('Evaluation Error:', error);
      }
  
      if (game.answers.length === game.players.length) {
        game.currentQuestionIndex += 1;
        game.answers = [];
      }
    }
  
    

const nextQuestion = (gameId) =>{
    const game = getGame(gameId);
    
    game.currentQuestionIndex += 1;
      
};
}
module.exports = {
    createGame,
    addPlayerToGame,
    getGame,
    getCurrentQuestion,
    generateQuestions,
    submitAnswer,
  
}

