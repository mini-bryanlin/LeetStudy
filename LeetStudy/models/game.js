const {v4: uuidv4} = require('uuid');
const { createPlayer, getPlayerById, addPoints } = require('./player'); // Import the player model
const games = [];
const openai = require('openai');
console.log(openai)
const evaluateAnswer = async (question, playerAnswer) => {
  try {
      const response = await openai.Completion.create({
          engine: 'text-davinci-003',  // GPT-3 model
          prompt: `Evaluate the following answer based on the question and score it from 0 to 100.\n\nQuestion: ${question}\nAnswer: ${playerAnswer}\nScore (0-100):`,
          max_tokens: 10,
          temperature: 0.0  // Set temperature to 0 for deterministic output
      });


      const scoreText = response.choices[0].text.trim();
      console.log(scoreText)
      const score = parseFloat(scoreText); // Convert the response to a float
      if (isNaN(score)) {
          throw new Error('Received invalid score from OpenAI');
      }
      return score;
  } catch (error) {
      console.error('Error evaluating answer:', error);
      return 0;  // Fallback score in case of error
  }
};

const generateQuestions = async (topic, difficulty) => {
  try {
      const response = await openai.Completion.create({
          engine: 'text-davinci-003',  // GPT-3 model
          prompt: `Generate 5 multiple-choice questions about ${topic} with a ${difficulty} level. Include 4 choices and the correct answer.`,
          max_tokens: 200,
          n: 1,
          temperature: 0.7
      });
      setTimeout(() => {
        console.log("3 seconds have passed!");
    }, 10000); 

      const questionsText = response.choices[0].text.trim();
      const questions = questionsText.split('\n').map((questionText) => {
          const [question, correctAnswer] = questionText.split(':');
          return { question: question.trim(), correctAnswer: correctAnswer.trim() };
      });

      return questions;
  } catch (error) {
      console.error('Error generating questions:', error);
      return [
          { question: 'What is the capital of France?', correctAnswer: 'Paris' },
          { question: 'Who wrote "Hamlet"?', correctAnswer: 'Shakespeare' },
          { question: 'What is 2 + 2?', correctAnswer: '4' }
      ];  // Default fallback questions in case of error
  }
};
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
    // const player = createPlayer(username,true);
    // game.players.push(player.id);
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

