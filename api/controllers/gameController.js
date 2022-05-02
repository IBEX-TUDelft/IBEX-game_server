import gameService from '../services/gameService.js';
import games from '../repositories/gameRepository.js';
import Controller from '../helpers/controller.js';
import WssManagement from '../services/wssGameService.js';
import GameManagement from '../services/gameManager.js';

export default {
    apply (app) {
        const wssManager = WssManagement.create();
        const gameManager = GameManagement.create();
        
        wssManager.init(gameManager);
        gameManager.init(wssManager);

        Controller.addPostRoute(app, '/api/v1/games/create', true, async (req, res) => {
            const gameId = await gameService.createGame(req.body.gameParameters);
            
            Controller.handleSuccess(res, { id : gameId }, 'Game created');
        });

        Controller.addGetRoute(app, '/api/v1/games/list', true, async (req, res) => {
            const records = await games.list();

            const gs = gameManager.games.map(g => g.data).map(d => { return {
                "id": d.id,
                "title": d.title,
                "type": d.parameters.game_type,
                "assignedPlayers": d.assignedPlayers,
                "currentRound": d.currentRound
            }});

            records.forEach(r => {
                const game = gs.find(g => g.id === r.id);

                if (game == null) {
                    return;
                }
                
                if (game.currentRound != null) {
                    r.round_number = game.currentRound;
                }
            });

            Controller.handleSuccess(res, records, 'Data found');
        });

        Controller.addGetRoute(app, '/api/v1/games/status', false, async (req, res) => {
            const gameId = parseInt(req.query.id);
            const recovery = req.query.recovery;

            const game = gameManager.games.find(g => g.data.id === gameId);

            if (game == null) {
                console.log(gameManager.games);
                return Controller.handleGenericError(res, `Game with id ${gameId} not found`, 400);
            }

            const player = game.data.players.find(p => p.recovery === recovery);

            const data = {
                "found": false,
                "canJoin": true,
                "gameData": null
            }

            let message;

            if (player == null) {
                console.log(`Player with recovery ${recovery} not found in game ${gameId}`);

                console.log(`Current players: ${game.data.assignedPlayers}, Total players: ${game.data.parameters.total_players}`);

                if (game.data.assignedPlayers < game.data.parameters.total_players) {
                    // 1: player not found, can join
                    message = `Player not found but game ${gameId} can still be joined`;
                } else {
                    // 2: else player not found, but the game is already full
                    message = `Game ${gameId} is full`;
                    data.canJoin = false;
                }
            } else {
                console.log(`Player with recovery ${recovery} found in game ${gameId}: returning his data`);
                // 3: player found, here is yor data

                data.found = true;
                data.gameData = game.getRecoveryData(player.number);

                message = `Game ${gameId}: player found, recovery data will be returned`;
            }

            Controller.handleSuccess(res, data, message);
        });

        Controller.addGetRoute(app, '/api/v1/games/delete', true, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            await gameService.deleteById(gameId);

            await wssManager.deleteGame(gameId);

            await gameManager.deleteGame(gameId);

            const records = await games.list();

            console.log(records);

            Controller.handleSuccess(res, records, `Game ${gameId} deleted.`);
        });

        Controller.addGetRoute(app, '/api/v1/games/start', true, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            wssManager.startGame(gameId);

            const error = await gameManager.startGame(gameId);

            console.log(error);

            if (error == null) {
                Controller.handleSuccess(res, {}, 'Game started');
            } else {
                Controller.handleGenericError(res, error, 400);
            }
        });

        Controller.addGetRoute(app, '/api/v1/games/started', false, async (req, res) => {
            const games = gameManager.games.map(g => g.data).map(d => { return {
                    "id": d.id,
                    "title": d.title,
                    "type": d.parameters.game_type,
                    "assignedPlayers": d.assignedPlayers,
                    "currentRound": d.currentRound
                }
            });

            Controller.handleSuccess(res, games, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/data', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const game = gameManager.games.find(g => g.data.id  == gameId);

            const data = {
                "ruleset": game.data.type
            };

            switch(game.data.type) {
                case 'Harberger':
                    if (game.results[2] != null) {
                        data.firstDeclarations = game.results[2].declarations;
                    }
        
                    if (game.results[3] != null) {
                        data.winningCondition = game.results[3].winningCondition;
                    }
        
                    if (game.results[4] != null) {
                        data.firstSnipes = game.results[4].snipes;
                        data.firstSnipeResults = game.results[4].snipeOutcomes;
                    }
        
                    console.log(game.results[5]);
        
                    if (game.results[5] != null) {
                        data.signals = game.results[5].signals;
                    }
        
                    if (game.results[7] != null) {
                        data.secondDeclarations = game.results[7].declarations;
                    }
        
                    if (game.results[9] != null) {
                        data.secondSnipes = game.results[9].snipes;
                        data.secondSnipeResults = game.results[9].snipeOutcomes;
                    }
        
                    break;
                case 'Futarchy':
                    if (game.results[2] != null) {
                        data.firstDeclarations = game.results[2].declarations;
                    }
        
                    if (game.results[6] != null) {
                        data.winningCondition = game.results[6].winningCondition;
                        data.firstSnipes = game.results[6].snipes;
                        data.firstSnipeResults = game.results[6].snipeOutcomes;
                    }
        
                    console.log(game.results[5]);
        
                    if (game.results[5] != null) {
                        data.signals = game.results[5].signals;
                    }
        
                    if (game.results[7] != null) {
                        data.secondDeclarations = game.results[7].declarations;
                    }
        
                    if (game.results[9] != null) {
                        data.secondSnipes = game.results[9].snipes;
                        data.secondSnipeResults = game.results[9].snipeOutcomes;
                    }
        
                    break;
                case 'Voting':
                    if (game.results[3] != null) {
                        data.compensationRequests = game.results[3].compensationRequests;
                    }

                    if (game.results[4] != null) {
                        data.compensationOffers = game.results[4].compensationOffers;
                    }

                    if (game.results[5] != null) {
                        data.compensationDecisions = game.results[5].compensationDecisions;
                    }

                    if (game.results[6] != null) {
                        data.results = game.results[6].results;
                        data.winningCondition = game.results[6].winningCondition;
                    }

                    break;
                default:
                    break;
            }

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/market-log', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const game = gameManager.games.find(g => g.data.id  == gameId);

            const data = {
                "ruleset": game.data.type,
                "winningCondition": game.data.winningCondition
            };

            if (game.results[6] != null) {
                data.marketLog = game.results[6].log;
            }

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/chat-log', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const game = gameManager.games.find(g => g.data.id  == gameId);

            const data = {
                "ruleset": game.data.type,
            };

            if (game.results[2] != null) {
                data.chatLog = game.results[2].chatLog;
                data.players = game.data.players.map(p => {
                    return {
                        "number": p.number,
                        "tag": p.tag
                    }
                });
            }

            Controller.handleSuccess(res, data, 'Data available');
        });
    }
};
