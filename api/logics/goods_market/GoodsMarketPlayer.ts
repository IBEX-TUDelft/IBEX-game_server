import Good from "./Good.ts";
import { GoodsMarketAuthority } from "./GoodsMarketAuthority.ts";

export default class GoodsMarketPlayer {

    recovery: string;
    authority: GoodsMarketAuthority;
    gameId: number;
    number: number;
    wallet: {
        cash: number;
        goods: Good[];
    };

    constructor() {
        this.wallet = {
            cash: 0,
            goods: []
        };
    }
}