import WssManagement from '../services/wssGameService.js';
import GameManagement from '../services/gameManager.js';
import Controller from '../helpers/controller.js';
import GoodsMarketPlayer from '../logics/goods_market/model/GoodsMarketPlayer.ts';
import { Request, Response } from 'express';
import gameService from '../services/gameService.js';
import { GoodsMarketService } from '../services/GoodsMarketService.ts';

export default {
    apply(app) {
        const wssManager = WssManagement.get();
        const gameManager = GameManagement.get();

        wssManager.init(gameManager);
        gameManager.init(wssManager);

        Controller.addGetRoute(app, '/api/v1/games/goods-market/join', false, async (req: Request, res: Response) => {
            const gameId = parseInt(req.query.gameId?.toString());

            try {
                const player: GoodsMarketPlayer = await GoodsMarketService.join(gameId, req.query.token?.toString());

                Controller.handleSuccess(res, {
                    "redirect": `/goods-market/${gameId}/${player.recovery}`,
                    "player": player
                }, 'Joined');
            } catch (e) {
                console.error(`Error while trying to join game ${gameId}`, e);
                return Controller.handleGenericError(res, `Error while trying to join game ${gameId}: ${e.message}`, 400);
            }
        });

        Controller.addGetRoute(app, '/api/v1/games/goods-market/market-log', false, async (req: Request, res: Response) => {
            const gameId = parseInt(req.query.game_id?.toString());

            const game = await gameService.findGameData(gameId);

            const data = {
                "ruleset": game.type,
                "players": game.players.map(p => {
                    return {
                        "number": p.number,
                        "tag": p.tag
                    }
                }),
                "marketLog": game.results[1].phase[1].log
            };

            Controller.handleSuccess(res, data, 'Data available');
        });
    }
}
