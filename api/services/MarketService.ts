import {
    MARKET_ADMIN,
    MARKET_GAME_ADMIN,
    MARKET_GAME_KNOWS_ALL,
    MARKET_GAME_KNOWS_NOTHING,
    MARKET_GAME_PRIV_SIG_ONLY,
    MARKET_GAME_PUB_SIG_ONLY,
    MARKET_PLAYER,
    MarketPlayer
} from '../logics/market/MarketPlayer.js';
import GameManagement from '../services/gameManager.js';
import Utils from "../helpers/utils.js";
import { v4 as uuidv4 } from 'uuid';

const gameManager = GameManagement.get();

export const MarketService = {
    async join(gameId: number, token: string): Promise<MarketPlayer> {
        const game = gameManager.games.find(g => g.data.id === gameId);

        if (game == null) {
            throw new Error(`Game with id ${gameId} not found`);
        }

        const gameData = game.data;

        const player = new MarketPlayer();

        let verification: { role: number; };

        try {
            verification = Utils.verifyJWT(token);
        } catch (e) {
            console.log('New unathenticated player');
        }

        const desiredRatios = [
            gameData.parameters.players_knowing_both_signals,
            gameData.parameters.players_knowing_private_signal,
            gameData.parameters.players_knowing_public_signal,
            gameData.parameters.players_knowing_no_signal
        ];

        const getQuadraticDistance = (delta = [0, 0, 0, 0]) => {
            if (delta.length != 4) {
                throw new Error(`Delta vector length not compatible. Must be 4, was ${delta.length}`);
            }

            const total = gameData.players.filter(p => p.role != MARKET_GAME_ADMIN).length
                + delta[0] + delta[1] + delta[2] + delta[3];

            const currentRatios = [
                (gameData.players.filter((p: MarketPlayer) => p.role === MARKET_GAME_KNOWS_ALL).length + delta[0]) * 100 / total,
                (gameData.players.filter((p: MarketPlayer) => p.role === MARKET_GAME_PRIV_SIG_ONLY).length + delta[1]) * 100 / total,
                (gameData.players.filter((p: MarketPlayer) => p.role === MARKET_GAME_PUB_SIG_ONLY).length + delta[2]) * 100 / total,
                (gameData.players.filter((p: MarketPlayer) => p.role === MARKET_GAME_KNOWS_NOTHING).length + delta[3]) * 100 / total
            ];

            let distance = 0;

            for (let i = 0; i < currentRatios.length; i++) {
                distance += Math.pow(Math.abs(currentRatios[i] - desiredRatios[i]), 2);
            }

            return distance;
        }

        if (verification == null || verification.role != 0) {
            player.authority = MARKET_PLAYER;

            let best = null;
            let bestScore = null;

            const roles = [
                MARKET_GAME_KNOWS_ALL,
                MARKET_GAME_PRIV_SIG_ONLY,
                MARKET_GAME_PUB_SIG_ONLY,
                MARKET_GAME_KNOWS_NOTHING
            ];

            for (let i = 0; i < 4; i++) {
                const delta = [0, 0, 0, 0];

                delta[i] = 1;

                const score = getQuadraticDistance(delta);

                if (bestScore == null || score < bestScore) {
                    best = i;
                    bestScore = score;
                }
            }

            player.role = roles[best];
        } else {
            player.authority = MARKET_ADMIN;
            player.role = MARKET_GAME_ADMIN;
        }

        player.gameId = gameId;

        while (
            player.recovery === '' ||
            gameData.players.find((p: MarketPlayer) => p.recovery === player.recovery) != null
        ) {
            player.recovery = uuidv4();
        }

        player.wallet = {
            "balance": gameData.parameters.cash_per_player,
            "shares": gameData.parameters.shares_per_player
        }

        player.shares = gameData.parameters.shares_per_player;
        player.cash = gameData.parameters.cash_per_player;

        player.number = gameData.players.length;

        const knowsPrivateSignal = [MARKET_GAME_KNOWS_ALL, MARKET_GAME_PRIV_SIG_ONLY].includes(player.role);

        if (knowsPrivateSignal) {
            player.signal = game.generateSignal();
        }

        if (player.role === MARKET_GAME_ADMIN) {
            player.signal = gameData.realValue;
        }

        gameData.players.push(player);
        gameData.assignedPlayers = gameData.players.length;

        return player;
    }
}