import JoinablePhase from "../../JoinablePhase.js";
import GoodsMarketPlayer from "../model/GoodsMarketPlayer.ts";
import { GoodsMarketGoodQuality } from "../model/GoodsMarketTypes.ts";

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
            const currentValue = this.getWalletValue(p);
            const initialValue = this.getInitialWalletValue(p);

            let profit = Math.round((currentValue - initialValue) * 100) / 100;

            this.results.profits.push({
                "number": p.number,
                "role": p.role,
                "profit": profit,
                "signals": {...p.signals},
                "finalWallet": {...p.wallet},
                "initialWallet": {...p.initialWallet}
            });

            this.wss.sendEvent(
                this.game.id,
                p.number,
                "profit-report",
                {
                    "profit": profit,
                    "finalPrice": finalPrice,
                    "finalWallet": {...p.wallet},
                    "initialWallet": {...p.initialWallet},
                    "realValues": {
                        "highQuality": this.game.parameters.high_quality_value,
                        "lowQuality": this.game.parameters.low_quality_value
                    }
                }
            );
        });
    }

    getWalletValue(player: GoodsMarketPlayer) {
        const highQualityGoodValue = player.wallet.goods.filter(good => good.quality === GoodsMarketGoodQuality.GOOD).length * player.signals.highQualitySignal;
        const lowQualityGoodValue = player.wallet.goods.filter(good => good.quality === GoodsMarketGoodQuality.BAD).length * player.signals.lowQualitySignal;

        return player.wallet.cash + highQualityGoodValue + lowQualityGoodValue;
    }

    getInitialWalletValue(player: GoodsMarketPlayer) {
        const highQualityGoodValue = player.initialWallet.goods.filter(good => good.quality === GoodsMarketGoodQuality.GOOD).length * player.signals.highQualitySignal;
        const lowQualityGoodValue = player.initialWallet.goods.filter(good => good.quality === GoodsMarketGoodQuality.BAD).length * player.signals.lowQualitySignal;

        return player.initialWallet.cash + highQualityGoodValue + lowQualityGoodValue;
    }
}