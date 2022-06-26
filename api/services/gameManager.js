import gameRepository from '../repositories/gameRepository.js';
import gameParameterRepository from '../repositories/gameParameterRepository.js';
import gamePlayerRepository from '../repositories/gamePlayerRepository.js';
import WS from '../helpers/websocket.js';
import Harberger from '../logics/harberger/Harberger.js';
import Futarchy from '../logics/futarchy/Futarchy.js';
import Voting from '../logics/voting/Voting.js';

export default {
    create() {
        return {
            wssManager: null,
            games: [],
            startGame: async function(gameId) {
                console.log('GAMEMASTER Game ID: ' + gameId + " Typeof: " + typeof gameId);

                if (this.games.find(g => g.data.id  == gameId) != null) {
                    return `Game ${gameId} already started.`;
                }

                // 1: Load the data

                const gameRecord = await gameRepository.findOne(gameId);

                if (gameRecord == null) {
                    return `Game ${gameId} not found`;
                }

                if (gameRecord.ended_at != null || gameRecord.updated_at != null) {
                    return `Game ${gameId} cannot be started: it was already started or ended.`;
                }

                const gameData = {
                    id: gameRecord.id,
                    title: gameRecord.title,
                    createdAt: gameRecord.created_at,
                    updatedAt: gameRecord.updated_at,
                    endedAt: gameRecord.ended_at,
                    parameters: {},
                    players: [],
                    assignedPlayers: 0,
                    rounds: [],
                    currentRound: null
                }

                const gameParameters = await gameParameterRepository.findByGameId(gameRecord.id);

                gameParameters.forEach(gp => {
                    switch(gp.type) {
                        case 'string':
                            gameData.parameters[gp.key] = gp.value;
                            break;
                        case 'number':
                            try {
                                gameData.parameters[gp.key] = parseInt(gp.value);
                            } catch (e) {
                                const errMessage = `Game ${gameId}'s parameter ${gp.key} value (${gp.value}) cannot be parsed as integer (type: number)`;
                                console.error(errMessage);
                                return errMessage;                                
                            }
                            break;
                        case 'float':
                            try {
                                gameData.parameters[gp.key] = parseFloat(gp.value);
                            } catch (e) {
                                const errMessage = `Game ${gameId}'s parameter ${gp.key} value (${gp.value}) cannot be parsed as float (type: float)`;
                                console.error(errMessage);
                                return errMessage;                                
                            }
                            break;
                        default:
                            const errMessage = `Game ${gameId}'s parameter ${gp.key} (value: ${gp.value}) has an unrecognized type: ${gp.value}. Should be string|number`;
                            console.error(errMessage);
                            return errMessage;
                    }
                });

                const gamePlayers = await gamePlayerRepository.findByGameId(gameRecord.id);

                gamePlayers.forEach(p => {
                    p.shares = parseInt(p.shares);
                    p.balance = parseInt(p.balance);
                    p.game_id = parseInt(p.game_id);
                })

                gameData.parameters.total_players = gameData.parameters.speculators_count + gameData.parameters.owners_count + gameData.parameters.developers_count;

                if (gamePlayers.length != gameData.parameters.total_players) {
                    return `Game ${gameId} has ${gamePlayers.length} players but ${gameData.parameters.total_players} were expected. This is most likely a player generation a bug`;
                }

                gameData.players.push(...gamePlayers);

                console.log(`Game ${gameId} loaded.`);
                //console.log(gameData);

                // 2: Create the game logic

                let game;

                switch(gameData.parameters.game_type) {
                    case 'harberger':
                        game = new Harberger(gameData);
                        await game.init();
                        //game = await Harberger.create(gameData);
                        break;
                    case 'futarchy':
                        game = new Futarchy(gameData);
                        await game.init();
                        break;
                    case 'voting':
                        game = new Voting(gameData);
                        await game.init();
                        break;
                    default:
                        console.error(`Game type unknown: ${gameData.parameters.game_type}`);
                }

                this.games.push(game);

                await game.start(this.wssManager);

                console.log(gameData);
                
                return null; //Success
            },
            init(wssManager) {
                this.wssManager = wssManager;
            },
            handleMessage: async function (ws, message) {
                const self = this;

                const game = self.games.find(g => g.data.id  === message.gameId);

                if (game == null) {
                    WS.send(ws, {
                        "error": `Game ${message.gameId} not found`
                    });
                    return;
                }

                switch(message.type) {
                    case 'status':
                        //TODO: provide the player status within the game
                        WS.sendEvent(ws, 'status', {
                            "joined": game.data.players.find(p => p.recovery === message.recovery)
                        });
                        break;
                    case 'rejoin':
                        const player = game.data.players.find(p => p.recovery === message.recovery);

                        if (player == null) {
                            WS.send(ws, {
                                "error": `Cannot rejoin game ${message.gameId}: invalid recovery string`
                            });
                            return;
                        }

                        this.wssManager.joinGame(ws, message.gameId, player.role, player.number);

                        break;
                    default:
                        await game.pushMessage(ws, message);
                }
            },
            deleteGame: function (gameId) {
                this.games = this.games.filter(g => g.data.id  != gameId);
            }
        }
    }
}