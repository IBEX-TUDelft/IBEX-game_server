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

            Controller.handleSuccess(res, records, 'Data found');
        });

        Controller.addGetRoute(app, '/api/v1/games/delete', true, async (req, res) => {
            const gameId = req.query.game_id;

            await gameService.deleteById(gameId);

            await wssManager.deleteGame(gameId);

            await gameManager.deleteGame(gameId);

            const records = await games.list();

            console.log(records);

            Controller.handleSuccess(res, records, `Game ${gameId} deleted.`);
        });

        Controller.addGetRoute(app, '/api/v1/games/start', true, async (req, res) => {
            const gameId = req.query.game_id;

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
            const gameId = req.query.game_id;

            const game = gameManager.games.find(g => g.data.id  == gameId);

            const data = {
                "ruleset": game.data.type
            };

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

            if (game.results[7] != null) {
                data.secondDeclarations = game.results[7].declarations;
            }

            if (game.results[9] != null) {
                data.secondSnipes = game.results[9].snipes;
                data.secondSnipeResults = game.results[9].snipeOutcomes;
            }

            Controller.handleSuccess(res, data, 'Data available');
        });

        Controller.addGetRoute(app, '/api/v1/games/market-log', false, async (req, res) => {
            const gameId = req.query.game_id;

            const game = gameManager.games.find(g => g.data.id  == gameId);

            const data = {
                "ruleset": game.data.type
            };

            if (game.results[6] != null) {
                data.marketLog = game.results[6].log;
            }

            Controller.handleSuccess(res, data, 'Data available');
        });
    }
};
