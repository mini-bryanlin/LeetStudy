const {v4: uuidv4} = require('uuid');

const players = [];

const createPlayer = (username) => {
    const player= {
        id:uuidv4(),
        username,
        gameId: null,
        points:0,
        answers: null,

    };
    players.push(player);
    return player;
};
const getPlayerById = (playerId) =>{
    return players.find(player=>player.id === playerId);

};
const setPlayerGame = (playerId,gameId) =>{
    const player = getPlayerById(playerId);
    if (player){
        player.gameId = gameId;
        }
};
const submitPlayerAnswer = (playerId, answer, timeTaken) => {
    const player = getPlayerById(playerId);
    if (player) {
        player.answer = answer;
        timeTaken;
      }
    };
    module.exports = {
        createPlayer,
        getPlayerById,
        setPlayerGame,
        submitPlayerAnswer,
        nextQuestion,
      };
