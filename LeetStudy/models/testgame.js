// const { getQuestion } = require('../controllers/gameController');
const { createGame, addPlayerToGame, getCurrentQuestion, submitAnswer, generateQuestions,nextQuestion,getQuestion} = require('./game');

// Step 1: Create a game
const game = createGame('General Knowledge', 'easy', 'player1');
console.log('Game Created:', game);

// Step 2: Add players to the game
addPlayerToGame(game.id, 'player1');
addPlayerToGame(game.id, 'player2');
console.log('Players added:', game.players);
while (game.currentQuestionIndex < game.questions.length){
    console.log(getQuestion(game.id))
    let result = submitAnswer(game.id, 'player1', 'Paris', 5); // Answer and time taken in seconds
    console.log('Player 1 Answer Result:', result);
    result = submitAnswer(game.id, 'player2', 'Shakespeare', 4); // Answer and time taken in seconds
    console.log('Player 2 Answer Result:', result);

    
}


// Step 4: Player 1 answers the question
let result = submitAnswer(game.id, 'player1', 'Paris', 5); // Answer and time taken in seconds
console.log('Player 1 Answer Result:', result);

// // Step 5: Show the next question (if any)
// currentQuestion = getCurrentQuestion(game.id);
// console.log('Next Question:', currentQuestion);

// // Step 6: Player 2 answers the question
// result = submitAnswer(game.id, 'player2', 'Shakespeare', 4); // Answer and time taken in seconds
// console.log('Player 2 Answer Result:', result);

// // Step 7: Display game answers
// console.log('Game Answers:', game.answers);
