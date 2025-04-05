// const { getQuestion } = require('../controllers/gameController');
const { createGame, addPlayerToGame, getCurrentQuestion, submitAnswer, generateQuestions,nextQuestion} = require('./game');
const {createPlayer} = require('./player')
// Step 1: Create a game
const game = createGame('General Knowledge', 'easy', 'player1');
console.log('Game Created:', game);
let players = []
const player1 = createPlayer('player1',false)
const player2= createPlayer('player2', false)

// Step 2: Add players to the game
players.push(player1)
players.push(player2)
addPlayerToGame(game.id, player1.id);
addPlayerToGame(game.id, player2.id);
console.log('Players added:', game.players);
while(game.currentQuestionIndex < game.questions.length){
console.log(getCurrentQuestion(game.id))
let result = submitAnswer(game.id, player1.id, 'Paris', 5); // Answer and time taken in seconds
console.log('Player 1 Answer Result:', result);
result = submitAnswer(game.id,player2.id, 'penis', 4); // Answer and time taken in seconds
console.log('Player 2 Answer Result:', result);
console.log( game.currentQuestionIndex)}
console.log(players)



// Step 4: Player 1 answers the question


// // Step 5: Show the next question (if any)
// currentQuestion = getCurrentQuestion(game.id);
// console.log('Next Question:', currentQuestion);

// // Step 6: Player 2 answers the question
// result = submitAnswer(game.id, 'player2', 'Shakespeare', 4); // Answer and time taken in seconds
// console.log('Player 2 Answer Result:', result);

// // Step 7: Display game answers
// console.log('Game Answers:', game.answers);
