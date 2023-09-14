import GamePhase from "./GamePhase.js";

import { MARKET_GAME_ADMIN, MARKET_GAME_KNOWS_ALL, MARKET_GAME_PUB_SIG_ONLY } from "../MarketPlayer.js";

class ResultPhase extends GamePhase {

    results = {
        profits: []
    }

    constructor (game, wss) {
        super (game, wss, []);

        this.complete = true;
    }

    testComplete () {
        return this.complete === true;
    }

    getData () {
        return this.game.players;
    }

    async onEnter() {
        super.onEnter();

        const round = this.game.results[this.game.results.length - 1];
        const marketPhase = round.phase[round.phase.length - 1];

        const realValue = this.game.realValue;
        const finalPrice = marketPhase.finalPrice | 0;

        const initialValue = this.game.parameters.cash_per_player +
            this.game.parameters.shares_per_player * realValue; //TODO: should be the "real value"

        console.log(`Final price: ${realValue}, Initial value: ${initialValue} = ${this.game.parameters.cash_per_player} +
            ${this.game.parameters.shares_per_player} * ${realValue}`);

        this.game.players.forEach(p => {
            const finalValue = p.wallet.balance +
                p.wallet.shares * realValue; //TODO: should be the "real value"

            const profit = Math.round ( (finalValue - initialValue) * 100 ) / 100;

            console.log(`Player ${p.number} profit: ${profit} = ${p.wallet.balance} + ${p.wallet.shares}
                 * ${realValue} - ${initialValue}`);

            this.results.profits.push({
                "number": p.number,
                "profit": profit
            });

            this.wss.sendEvent(
                this.game.id,
                p.number,
                "profit-report",
                {
                    "profit": profit,
                    "realValue": realValue,
                    "finalPrice": finalPrice
                }
            );
        });
    }

    async onExit () {
        await super.onExit();

        this.game.players.filter(player => {
            player.role === MARKET_GAME_ADMIN ||
            player.role === MARKET_GAME_KNOWS_ALL ||
            player.role === MARKET_GAME_PUB_SIG_ONLY
        }).forEach(player => {
            this.wss.sendEvent(
                this.game.id,
                player.number,
                "public-signal",
            {
                "publicSignal": this.game.publicSignal
            }
            );
        });
    }
}

export default {
    create(game, wss) {
        return new ResultPhase(game, wss, 0);
    }
}