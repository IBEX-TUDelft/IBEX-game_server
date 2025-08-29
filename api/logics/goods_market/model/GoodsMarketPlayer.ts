import GoodsMarketGood from "./GoodsMarketGood.ts";
import { GoodsMarketAuthority } from "./GoodsMarketTypes.ts";

export default class GoodsMarketPlayer {

    recovery: string;
    authority: GoodsMarketAuthority;
    gameId: number;
    number: number;
    role: number;

    initialWallet: {
        cash: number;
        goods: GoodsMarketGood[];
    };

    wallet: {
        cash: number;
        goods: GoodsMarketGood[];
    };

    signals: {
        highQualitySignal: number,
        lowQualitySignal: number
    }

    constructor() {
        this.wallet = {
            cash: 0,
            goods: []
        };

        this.signals = {
            highQualitySignal: -1,
            lowQualitySignal: -1
        };
    }
}