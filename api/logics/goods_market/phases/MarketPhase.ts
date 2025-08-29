import JoinablePhase from "../../JoinablePhase.js";
import CancelOrderHandler from "../handlers/CancelOrderHandler.ts";
import PostOrderHandler from "../handlers/PostOrderHandler.ts";
import EndHandler from "../handlers/EndHandler.ts";
import GoodsMarketOrder from "../model/GoodsMarketOrder.ts";
import { GoodsMarketGoodQuality, GoodsMarketOrderType } from "../model/GoodsMarketTypes.ts";
import GoodsMarketGood from "../model/GoodsMarketGood.ts";
import GoodsMarketPlayer from "../model/GoodsMarketPlayer.ts";

export default class MarketPhase extends JoinablePhase {

    orderList = [];
    movementList = [];
    orders: GoodsMarketOrder[] = [];
    results: {
        log: any[];
        transactions: {
            from: number;
            to: number;
            price: number;
            time: number;
            good: GoodsMarketGood;
        } [],
        wallets: {
            cash: number;
            goods: GoodsMarketGood[];
        }[];
        finalPrice: number | null;
    } = {
        log: [],
        wallets: [],
        transactions: [],
        finalPrice: null
    }

    constructor(game, wss, number: number) {
        super (game, wss, [new PostOrderHandler(), new CancelOrderHandler(), new EndHandler()], null, number);
    }

    async onExit () {
        await super.onExit();

        this.results.wallets.push(...this.game.players.map((p: GoodsMarketPlayer) => {
            return {
                "number": p.number,
                "wallet": p.wallet
            };
        }));

        if (this.movementList.length === 0) {
            return;
        }

        const lastMovement = this.movementList[this.movementList.length - 1];

        this.results.finalPrice = lastMovement.movement.price;
    }

    async testComplete () {
        return this.complete;
    }

    getData() {
        const self = this;

        return {
            "orders": self.orderList,
            "movements": self.movementList,
            "tickers": self.movementList.map((m: { movement: { price: number, time: number }}) => ({
                "price": m.movement.price,
                "time": m.movement.time
            }))
        };
    }

    getBestBid () {
        const bids = this.orders.filter(o => o.type === GoodsMarketOrderType.BID);

        if (bids == null || bids.length === 0) {
            return null;
        }

        const bestBid = bids.reduce((prev, curr) => curr.price > prev.price ? curr : prev);

        return bestBid.price;
    }

    getBestAsk () {
        const asks = this.orders.filter(o => o.type === GoodsMarketOrderType.ASK);

        if (asks == null || asks.length === 0) {
            return null;
        }

        const bestAsk = asks.reduce((prev, curr) => curr.price < prev.price ? curr : prev);

        return bestAsk.price;
    }

    printBook () {
        const self = this;

        return JSON.stringify({
            bids: self.orders.filter(o => o.type === 'bid').map(b => b.price),
            asks: self.orders.filter(o => o.type === 'ask').map(a => a.price)
        });
    }

    fulfillOrder (order: GoodsMarketOrder, sender: number) {
        const self = this;

        let counterparts: GoodsMarketOrder[];

        let match: GoodsMarketOrder = null;
        let error = null;

        switch(order.type) {
            case GoodsMarketOrderType.ASK:
                counterparts = this.orders.filter(o => o.type == GoodsMarketOrderType.BID && o.sender != sender);
                counterparts.sort((a, b) => b.price - a.price);

                if (counterparts.length == 0) {
                    console.log("No bids found");

                    return {
                        "type": "success",
                        "quantity": 1
                    }
                }

                match = counterparts[0];

                error = self.transferShares(sender, match.sender, 1, match.price, order, sender);

                if (error != null) {
                    return {
                        "type": "error",
                        "message": error
                    }
                }

                error = self.removeOrder(match.id);

                if (error != null) {
                    return {
                        "type": "error",
                        "message": error
                    }
                }

                break;
            case GoodsMarketOrderType.BID:
                counterparts = this.orders.filter(o => o.type == GoodsMarketOrderType.ASK && o.sender != sender);
                counterparts.sort((a, b) => a.price - b.price);

                match = counterparts[0];

                if (counterparts.length == 0) {
                    console.log("No asks found");

                    return {
                        "type": "success",
                        "quantity": 1
                    }
                }

                error = self.transferShares(match.sender, sender, 1, match.price, order, sender);
                if (error != null) {
                    return {
                        "type": "error",
                        "message": error
                    }
                }
                error = self.removeOrder(match.id);
                if (error != null) {
                    return {
                        "type": "error",
                        "message": error
                    }
                }

                break;
            default:
                return {
                    "type": "error",
                    "message": `Did not understand the order type: ${order.type}. Must be bid|ask`
                }
        }

        return {
            "type": "success",
            "quantity": 0
        }
    }

    transferShares (from: number, to: number, quantity: number, price: number, order: GoodsMarketOrder, actor: number) {
        const self = this;

        const actorPlayer: GoodsMarketPlayer = this.game.players.find((p : GoodsMarketPlayer) => p.number === actor); 
        const fromPlayer: GoodsMarketPlayer = this.game.players.find((p : GoodsMarketPlayer) => p.number === from);

        if (fromPlayer == null) {
            return `Player ${from} (from), not found`;
        }

        const toPlayer = this.game.players.find(p => p.number === to);

        if (toPlayer == null) {
            return `Player ${to} (to), not found`;
        }

        if (fromPlayer.wallet.goods.length < 1) {
            return `Player ${from} (from), does not have any goods to participate in the transaction.`;
        }

        if (toPlayer.wallet.cash < price) {
            return `Player ${to} (to), does not have the funds to complete the operation: ${toPlayer.wallet.cash} < ${price}`;
        }

        console.debug(fromPlayer);
        console.debug(toPlayer);

        let goodIndex: number;

        //Sell the bad stuff first
        if ((goodIndex = fromPlayer.wallet.goods.findIndex(g => g.quality === GoodsMarketGoodQuality.BAD)) === -1) {
            goodIndex = 0;
        }

        const soldGoods : GoodsMarketGood[] = fromPlayer.wallet.goods.splice(goodIndex, 1);
        fromPlayer.wallet.cash += price;

        const currentTime = Date.now();

        self.results.log.push({
            "id": order.id,
            "time": currentTime,
            "round": self.game.currentRound.number,
            "phase": self.number,
            "actor": {
                "number": actorPlayer.number,
                "role": actorPlayer.role
            },
            "buyer": {
                "number": toPlayer.number,
                "role": toPlayer.role
            },
            "seller": {
                "number": fromPlayer.number,
                "role": fromPlayer.role
            },
            "action": (order.type === 'ask' ? 'Sell' : 'Buy'),
            "price": price,
            "bestBid": self.getBestBid(),
            "bestAsk": self.getBestAsk(),
            "book": self.printBook()
        });

        this.wss.sendEvent(
            this.game.id,
            fromPlayer.number,
            "asset-movement",
            {
                "movement": {
                    "type": "sale",
                    "quantity": quantity,
                    "price": price,
                    "total": quantity * price
                },
                "cash": fromPlayer.wallet.cash,
                "goods" : fromPlayer.wallet.goods
            }
        );

        toPlayer.wallet.goods.push(...soldGoods);
        toPlayer.wallet.cash -= price;

        this.wss.sendEvent(
            this.game.id,
            toPlayer.number,
            "asset-movement",
            {
                "movement": {
                    "type": "purchase",
                    "price": price,
                },
                "cash": toPlayer.wallet.cash,
                "goods" : toPlayer.wallet.goods
            }
        );

        this.results.transactions.push({
            from: fromPlayer.number,
            to: toPlayer.number,
            price: price,
            time: currentTime,
            good: soldGoods[0]
        });

        this.movementList.push({
            "movement": {
                "order": self.orderList[self.orderList.length - 1],
                "price": price,
                "time": currentTime
            },
            "from": {
                "number": fromPlayer.number,
                "cash": fromPlayer.wallet.cash,
                "goods" : fromPlayer.wallet.goods
            },
            "to": {
                "number": toPlayer.number,
                "cash": toPlayer.wallet.cash,
                "goods" : toPlayer.wallet.goods
            }
        });

        const medianLastSeven = self.medianLastSeven();

        self.wss.broadcastEvent (
            self.game.id,
            "contract-fulfilled",
            {
                "from": fromPlayer.number,
                "to": toPlayer.number,
                "price": price,
                "median": medianLastSeven,
                "time": currentTime
            }
        );

        console.log(`Median last 7: ${medianLastSeven}`);

        console.log(fromPlayer);
        console.log(toPlayer);
    }

    removeOrder (id: number) {
        const order = this.orders.find(o => o.id == id);

        if (order == null) {
            return `Order with id = ${id} not found`;
        }

        this.orders.splice(this.orders.indexOf(order), 1);

        this.wss.broadcastEvent (
            this.game.id,
            "delete-order",
            {
                "order": {
                    "id": id,
                    "type": order.type
                }
            }
        );
    }

    medianLastSeven() {
        const values = this.movementList.map(m => m.movement.price).slice(-7);

        if (values.length === 0) {
            return null;
        }
        
        values.sort(function(a,b){
            return a-b;
        });

        var half = Math.floor(values.length / 2);
  
        if (values.length % 2)
            return values[half];
        
        return (values[half - 1] + values[half]) / 2.0;
    }
}