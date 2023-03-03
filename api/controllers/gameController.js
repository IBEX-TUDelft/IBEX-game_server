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

            games.reverse();
            
            Controller.handleSuccess(res, games, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/data', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const game = gameManager.games.find(g => g.data.id  == gameId);

            const data = {
                "ruleset": game.data.type
            };

            data.conditions = game.data.conditions;
            data.rewards = game.data.rewards;
            data.dataset = game.data.parameters.session_number;

            data.players = game.data.players.map(p => {
                return {
                    "number": p.number,
                    "tag": p.tag,
                    "role": p.role,
                    "values": p.property != null ? p.property.v : null,
                    "balance": p.balance,
                    "shares": p.shares,
                    "cashForSniping": p.cashForSniping
                }
            });

            data.results = game.data.results;
            data.startTime = game.data.startTime;

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/market-log', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const game = gameManager.games.find(g => g.data.id  == gameId);

            const data = {
                "ruleset": game.data.type,
                "players": game.data.players.map(p => {
                    return {
                        "number": p.number,
                        "tag": p.tag
                    }
                }),
                "conditions": game.data.conditions,
                "marketLogs": game.data.results.filter(r => r.phase[6] != null).map(r => r.phase[6].log)
            };

            if (game.data.type === 'Futarchy') {
                data.winningConditions = game.data.results.filter(r => r.phase[6] != null).map(r => r.phase[6].winningCondition)
            } else if (game.data.type === 'Harberger') {
                data.winningConditions = game.data.results.filter(r => r.phase[3] != null).map(r => r.phase[3].winningCondition)
            }

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/chat-log', false, async (req, res) => {
            const gameId = parseInt(req.query.game_id);

            const game = gameManager.games.find(g => g.data.id  == gameId);

            const data = {
                "ruleset": game.data.type,
                "players": game.data.players.map(p => {
                    return {
                        "number": p.number,
                        "tag": p.tag
                    }
                }),
                "results": game.data.results
            };

            Controller.handleSuccess(res, data, 'Data available');
        });
    }
};
