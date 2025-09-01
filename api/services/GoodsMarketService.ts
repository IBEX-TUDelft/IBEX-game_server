import Utils from "../helpers/utils.js";
import GoodsMarketGood from "../logics/goods_market/model/GoodsMarketGood.ts";
import GoodsMarketPlayer from "../logics/goods_market/model/GoodsMarketPlayer.ts";
import { GoodsMarketAuthority, GoodsMarketGoodQuality } from "../logics/goods_market/model/GoodsMarketTypes.ts";
import GameManagement from '../services/gameManager.js';
import { v4 as uuidv4 } from 'uuid';

const gameManager = GameManagement.get();

export default {
    async join(gameId: number, token: string): Promise<GoodsMarketPlayer> {
        const game = gameManager.games.find(g => g.data.id === gameId);

        if (game == null) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        const gameData = game.data;

        console.log(`Parameters: ${JSON.stringify(gameData.parameters)}`);

        const player: GoodsMarketPlayer = new GoodsMarketPlayer();

        let verification;

        try {
            verification = Utils.verifyJWT(token);
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

            player.signals.highQualitySignal = this.getDeltaAdjustedValue(gameData.parameters.high_quality_value, gameData.parameters.high_quality_delta);
            player.signals.lowQualitySignal = this.getDeltaAdjustedValue(gameData.parameters.low_quality_value, gameData.parameters.low_quality_delta);
        } else {
            player.authority = GoodsMarketAuthority.ADMIN;
            player.role = verification.role;

            player.signals.highQualitySignal = gameData.parameters.high_quality_value;
            player.signals.lowQualitySignal = gameData.parameters.low_quality_value;
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

        player.initialWallet = {
            cash: player.wallet.cash,
            goods: [...player.wallet.goods]
        };

        player.number = gameData.players.length;

        gameData.players.push(player);
        gameData.assignedPlayers = gameData.players.length;

        return player;
    },

    getDeltaAdjustedValue(value: number, delta: number): number {
        return Math.round(value * (100 - delta + Math.random() * delta * 2)) / 100;
    }
}