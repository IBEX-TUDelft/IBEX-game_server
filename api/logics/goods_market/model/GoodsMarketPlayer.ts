import GoodsMarketGood from "./GoodsMarketGood.ts";
import { GoodsMarketAuthority } from "./GoodsMarketTypes.ts";

export default class GoodsMarketPlayer {

    recovery: string;
    authority: GoodsMarketAuthority;
    gameId: number;
    number: number;
    role: number;

    wallet: {
        cash: number;
        goods: GoodsMarketGood[];
    };

    constructor() {
        this.wallet = {
            cash: 0,
            goods: []
        };
    }
}