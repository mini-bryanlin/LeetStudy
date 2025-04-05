const {v4: uuidv4} = require('uuid');

const players = [];

const createPlayer = (username,ownership) => {
    const player= {
        id:uuidv4(),
        username,
        gameId: null,
        points:0,
        answers: null,
        history:[],
        ownership
        

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
const addPoints = (playerId,points) =>{
    const player = getPlayerById(playerId);
    if (player){
        player.points += points;
    }

};
const addHistory = (playerId,gameId) =>{
    const player = getPlayerById(playerId);
    if (player){
        player.history.push(gameId);
    }

};
module.exports = {
        createPlayer,
        getPlayerById,
        setPlayerGame,
        
        addHistory,
        addPoints
      };
