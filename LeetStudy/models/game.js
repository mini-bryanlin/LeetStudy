const {v4: uuidv4} = require('uuid');
const { createPlayer, getPlayerById, addPoints } = require('./player'); // Import the player model
const games = [];


const generateQuestions = (topic, difficulty) => {
  
      const response = [
          { question: 'What is the capital of France?', correctAnswer: 'Paris' },
          { question: 'Who wrote "Hamlet"?', correctAnswer: 'Shakespeare' },
          { question: 'What is 2 + 2?', correctAnswer: '4' }
      ]; 
      return response; // Default fallback questions in case of error
  }

const createGame = (topic, difficulty,username) =>{
    const game = {
        id: uuidv4(),
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
    const player = getPlayerById(playerId)
    if (game){
        question = game.questions[game.currentQuestionIndex];
        const isCorrect = question.correctAnswer.toLowerCase() === answer.toLowerCase();
        game.answers.push({
            playerId,
            answer,
            timeTaken,
            correct: isCorrect,
        });
        try{
        const score =  evaluateAnswer(question, answer);
        player.answers.push(answer)
        
          console.log(score)
            addPoints(playerId,score);
        
          
        }
      catch(error){
        console.log('shit fucked up')
      }
        if (game.answers.length === game.players.length){
            game.currentQuestionIndex += 1;
            game.answers = []
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

