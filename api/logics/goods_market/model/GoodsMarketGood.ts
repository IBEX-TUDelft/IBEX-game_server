import { GoodsMarketGoodQuality } from "./GoodsMarketTypes.ts";

export default class GoodsMarketGood {

    static nextId = 0;

    id: number;
    quality: GoodsMarketGoodQuality;

    constructor(quality: GoodsMarketGoodQuality) {
        this.id = GoodsMarketGood.nextId++;
        this.quality = quality;
    }
    
}