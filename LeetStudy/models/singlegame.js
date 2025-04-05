const {v4: uuidv4} = require('uuid');
const { createPlayer, getPlayerById, addPoints } = require('./player'); // Import the player model
const games = [];
const generateQuestions = (topic, difficulty) => {
    const baseQuestions = [
      { question: 'What is the capital of France?', correctAnswer: 'Paris' },
      { question: 'Who wrote "Hamlet"?', correctAnswer: 'Shakespeare' },
      { question: 'What is 2 + 2?', correctAnswer: '4' },
    ];
  
    // Ask how to modify with Open AI API
    return baseQuestions;
  };
const onePersonGame = (username, topic, difficulty) =>{
    const game = {
            id: uuidv4(),
            topic,
            difficulty,
            player: null,
            currentQuestionIndex: 0,
            questions: generateQuestions(topic,difficulty),
            answers:[],
        };
    const player = createPlayer(username,false)
    game.player = player
    return game
}
const getCurrentQuestion = (gameId) =>{
    const game = getGame(gameId);
    if (game){
        return game.questions[game.currentQuestionIndex];

    }
    return null;

  };
  const submitAnswer = (gameId, playerId, answer) => {
      const game = getGame(gameId);
      const player = getPlayerById(playerId)
      if (game){
          question = game.questions[game.currentQuestionIndex];
          const isCorrect = question.correctAnswer.toLowerCase() === answer.toLowerCase();
          if (isCorrect){
            player.addPoints(10)
          }

        }
    }
module.exports= {
  
    onePersonGame,
    getCurrentQuestion,
    generateQuestions,
    

}
  