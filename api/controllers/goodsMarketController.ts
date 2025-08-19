import WssManagement from '../services/wssGameService.js';
import GameManagement from '../services/gameManager.js';
import Controller from '../helpers/controller.js';
import GoodsMarketPlayer from '../logics/goods_market/GoodsMarketPlayer.ts';
import Utils from '../helpers/utils.js';
import { GoodsMarketAuthority } from '../logics/goods_market/GoodsMarketAuthority.js';
import { v4 as uuidv4 } from 'uuid';
import Good from '../logics/goods_market/Good.js';
import { GoodQuality } from '../logics/goods_market/GoodQuality.js';
import { Request, Response } from 'express';

export default {
    apply(app) {
        const wssManager = WssManagement.get();
        const gameManager = GameManagement.get();

        wssManager.init(gameManager);
        gameManager.init(wssManager);

        Controller.addGetRoute(app, '/api/v1/games/goods-market/join', false, async (req: Request, res: Response) => {
            const gameId = parseInt(req.query.gameId?.toString());

            const game = gameManager.games.find(g => g.data.id === gameId);

            if (game == null) {
                console.log(gameManager.games);
                return Controller.handleGenericError(res, `Game with id ${gameId} not found`, 400);
            }

            const gameData = game.data;

            const player : GoodsMarketPlayer = new GoodsMarketPlayer();

            let verification;

            try {
                verification = Utils.verifyJWT(req.query.token);
            } catch (e) {
                console.log('New unathenticated player');
            }

            if (verification == null || verification.role != 0) {
                player.authority = Math.random() < 0.5 ? GoodsMarketAuthority.BUYER : GoodsMarketAuthority.SELLER; // Randomly assign BUYER or SELLER authority
            } else {
                player.authority = GoodsMarketAuthority.ADMIN;
            }

            player.gameId = gameId;

            while (
                player.recovery === '' ||
                gameData.players.find((p: GoodsMarketPlayer) => p.recovery === player.recovery) != null
            ) {
                player.recovery = uuidv4();
            }

            if (player.authority === GoodsMarketAuthority.BUYER) {
                player.wallet.cash = gameData.parameters.cash_per_player;
            } else {
                const quality: GoodQuality = Math.random() * 100 > gameData.parameters.bad_quality_ratio ?
                    GoodQuality.GOOD : GoodQuality.BAD;
                player.wallet.goods.push(new Good(quality));
            }

            player.number = gameData.players.length;

            gameData.players.push(player);
            gameData.assignedPlayers = gameData.players.length;

            Controller.handleSuccess(res, {
                "redirect": `/goods-market/${gameId}/${player.recovery}`,
                "player": player
            }, 'Joined');
        });
    }
}