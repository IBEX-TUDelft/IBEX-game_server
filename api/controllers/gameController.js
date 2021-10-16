import gameService from '../services/gameService.js';
import games from '../repositories/gameRepository.js';
import Controller from '../helpers/controller.js';
import { WebSocketServer } from 'ws';

export default {
    apply (app) {
        const s = new WebSocketServer({ port: process.env.VUE_APP_WEBSOCKET_PORT});

        s.on('connection', function connection(ws) {
            ws.on('message', function incoming(message) {
                console.log('received: %s', message);
            });
            
            ws.send('something');
        });

        Controller.addPostRoute(app, '/api/v1/games/create', true, async (req, res) => {
            const gameId = await gameService.createGame(req.body.gameParameters);
            
            Controller.handleSuccess(res, { id : gameId }, 'Game created');
        });

        Controller.addGetRoute(app, '/api/v1/games/list', true, async (req, res) => {
            const records = await games.list();

            Controller.handleSuccess(res, records, 'Data found');
        });

        Controller.addGetRoute(app, '/api/v1/games/start', true, async (req, res) => {
            const gameId = req.query.game_id;
            Controller.handleSuccess(res, {}, 'Game started');
        });
    }
};
