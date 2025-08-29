import JoinablePhase from "../../JoinablePhase.js";
import GoodsMarketPlayer from "../model/GoodsMarketPlayer.ts";
import { GoodsMarketAuthority } from "../model/GoodsMarketTypes.ts";

export default class ResultPhase extends JoinablePhase {
    results: {
        profits: any [],
        tickers: {
            price: number,
            time: Date
        } []
    } = {
        profits: [],
        tickers: []
    }

    constructor(game, wss, number: number) {
        super (game, wss, [], null, number);

        this.complete = true;
    }

    getData () {
        const self = this;

        return {
            "tickers": self.results.tickers
        };
    }

    async onEnter() {
        super.onEnter();

        const round = this.game.results[this.game.results.length - 1];
        const marketPhase = round.phase[round.phase.length - 1];

        const finalPrice = marketPhase.finalPrice | 0;

        this.results.tickers = marketPhase.transactions.map((tx: { price: number, time: Date }) => ({
            "price": tx.price,
            "time": tx.time
        }));

        this.game.players.forEach((p: GoodsMarketPlayer) => {
            const currentValue = p.wallet.cash + p.wallet.goods.length * finalPrice;

            let profit = 0;

            if (p.authority === GoodsMarketAuthority.BUYER) {
                profit = Math.round((currentValue - this.game.parameters.cash_per_player) * 100) / 100; //The buyer began with cash
                console.log(`Player ${p.number} profit: ${profit} = ${currentValue} - ${this.game.parameters.cash_per_player}`);
            } else if (p.authority === GoodsMarketAuthority.SELLER) {
                profit = Math.round((currentValue - finalPrice) * 100) / 100; //The seller's profit is decreased by the initial value he had. Initially he had one good, whose value is now known as the final price
                console.log(`Player ${p.number} profit: ${profit} = ${currentValue} - ${finalPrice}`);
            }

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
                    "finalPrice": finalPrice
                }
            );
        });
    }

}