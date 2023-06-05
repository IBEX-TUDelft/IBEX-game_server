import Controller from '../helpers/controller.js';

export default {
    apply (app) {
        Controller.addGetRoute(app, '/api/v1/templates/list', true, async (req, res) => {

        });

        Controller.addGetRoute(app, '/api/v1/templates/load', true, async (req, res) => {

        });

        Controller.addPostRoute(app, '/api/v1/templates/push', true, async (req, res) => {
            //const gameId = await gameService.createGame(req.body.gameParameters);
            
            //Controller.handleSuccess(res, { id : gameId }, 'Game created');
        });
    }
}