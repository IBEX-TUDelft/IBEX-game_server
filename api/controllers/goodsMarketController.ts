import WssManagement from '../services/wssGameService.js';
import GameManagement from '../services/gameManager.js';
import Controller from '../helpers/controller.js';
import GoodsMarketPlayer from '../logics/goods_market/model/GoodsMarketPlayer.ts';
import Utils from '../helpers/utils.js';
import { v4 as uuidv4 } from 'uuid';
import GoodsMarketGood from '../logics/goods_market/model/GoodsMarketGood.ts';
import { GoodsMarketGoodQuality, GoodsMarketAuthority } from '../logics/goods_market/model/GoodsMarketTypes.ts';
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

            console.log(`Parameters: ${JSON.stringify(gameData.parameters)}`);

            const player : GoodsMarketPlayer = new GoodsMarketPlayer();

            let verification;

            try {
                verification = Utils.verifyJWT(req.query.token);
            } catch (e) {
                console.log('New unathenticated player');
            }

            if (verification == null || verification.role != 0) {
                if (gameData.players.filter((p: GoodsMarketPlayer) => p.role === GoodsMarketAuthority.SELLER).length === 0) {
                    player.authority = GoodsMarketAuthority.SELLER;
                    player.role = GoodsMarketAuthority.SELLER;
                } else {
                    const sellerRatio = gameData.players.filter((p: GoodsMarketPlayer) => p.role === GoodsMarketAuthority.SELLER).length /
                        gameData.players.filter((p: GoodsMarketPlayer) => p.role !== GoodsMarketAuthority.ADMIN).length;

                    console.log(`Current seller ratio: ${sellerRatio}`);
                    
                    if (sellerRatio > 0.5) {
                        player.authority = GoodsMarketAuthority.BUYER;
                        player.role = GoodsMarketAuthority.BUYER;
                    } else {
                        player.authority = GoodsMarketAuthority.SELLER;
                        player.role = GoodsMarketAuthority.SELLER;
                    }
                }
            } else {
                player.authority = GoodsMarketAuthority.ADMIN;
                player.role = verification.role;
            }

            player.gameId = gameId;

            while (
                player.recovery == null || player.recovery === '' ||
                gameData.players.find((p: GoodsMarketPlayer) => p.recovery === player.recovery) != null
            ) {
                player.recovery = uuidv4();
            }

            if (player.authority === GoodsMarketAuthority.BUYER) {
                player.wallet.cash = gameData.parameters.cash_per_player;
            } else if (player.authority === GoodsMarketAuthority.SELLER) {
                if (gameData.players.filter((p: GoodsMarketPlayer) => p.role === GoodsMarketAuthority.SELLER).length === 0) {
                    player.wallet.goods.push(new GoodsMarketGood(GoodsMarketGoodQuality.GOOD));
                } else {
                    const totalGoods = gameData.players
                        .map((p: GoodsMarketPlayer) => p.wallet.goods)
                        .reduce((acc: number, g: GoodsMarketGood[]) => acc + g.length, 0);
                    
                    const badRatio = gameData.players
                        .map((p: GoodsMarketPlayer) => p.wallet.goods)
                        .flat()
                        .filter((g: GoodsMarketGood) => g.quality === GoodsMarketGoodQuality.BAD).length / totalGoods;

                    if (badRatio * 100 < gameData.parameters.bad_quality_ratio) {
                        player.wallet.goods.push(new GoodsMarketGood(GoodsMarketGoodQuality.BAD));
                    } else {
                        player.wallet.goods.push(new GoodsMarketGood(GoodsMarketGoodQuality.GOOD));
                    }
                }
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