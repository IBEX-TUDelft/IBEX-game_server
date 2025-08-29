import { GoodsMarketOrderType } from "./GoodsMarketTypes.ts";

export default class GoodsMarketOrder {
    id: number;
    sender: number;
    type: GoodsMarketOrderType;
    price: number;
    timestamp: number;
    now: boolean = false;

    static nextId = 0;

    constructor(sender: number, type: GoodsMarketOrderType, price: number, now: boolean = false) {
        this.id = GoodsMarketOrder.nextId++;
        this.sender = sender;
        this.type = type;
        this.price = price;
        this.timestamp = Date.now();
        this.now = now;
    }
}