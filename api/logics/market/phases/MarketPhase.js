import GamePhase from './GamePhase.js';
import { AppEvents } from '../../../helpers/AppEvents.js';
import PostOrderHandler from '../handlers/PostOrderHandler.js';
import CancelOrderHandler from '../handlers/CancelOrderHandler.js';
import EndHandler from '../handlers/EndHandler.js';

class MarketPhase extends GamePhase {

    orderList = [];
    movementList = [];
    orders = [];
    nextOrderId = 1;
    complete = false;
    results = {
        log: [],
        wallets: [],
        finalPrice: null
    }
    buyerTransactionCost = 0;
    sellerTransactionCost = 0;

    constructor(game, wss) {
        super (game, wss, [
            new PostOrderHandler(),
            new CancelOrderHandler(),
            new EndHandler()
        ]);

        if (typeof game.parameters.buyer_transaction_cost === 'number') {
            this.buyerTransactionCost = game.parameters.buyer_transaction_cost;
        }

        if (typeof game.parameters.seller_transaction_cost === 'number') {
            this.sellerTransactionCost = game.parameters.seller_transaction_cost;
        }
    }

    async onExit () {
        await super.onExit();

        this.results.wallets.push(...this.game.players.map(p => {
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

    async onEnter () {
        await super.onEnter();
            
        const timer = this.game.parameters.market_timer;

        console.log(`Timer: ${timer}m type = ${typeof timer}`);

        if (timer != null && typeof timer === 'number' && timer > 0) {
            this.setTimer(timer * 1000 * 60, timer * 1000 * 60);
            AppEvents.get(this.game.id).phaseTimeout(timer * 1000 * 60, {
                "phase": this.number,
                "round": this.game.currentRound.number
            });
        }

        console.log(`Allowing ${this.game.parameters.market_timer} minutes for trading`);
    }

    testComplete () {
        return this.complete;
    }

    getData() {
        const self = this;

        return {
            "orders": self.orderList,
            "movements": self.movementList
        };
    }

    getBestBid () {
        const bids = this.orders.filter(o => o.type === 'bid');

        if (bids == null || bids.length === 0) {
            return null;
        }

        const bestBid = bids.reduce((prev, curr) => curr.price > prev.price ? curr : prev);

        return bestBid.price;
    }

    getBestAsk () {
        const asks = this.orders.filter(o => o.type === 'ask');

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

    fulfillOrder (order, sender) {
        const self = this;

        let counterparts;

        let finished = false;
        let quantity = order.quantity;
        let i = 0;
        let error = null;

        switch(order.type) {
            case "ask":
                counterparts = this.orders.filter(o => o.type == "bid" && o.sender != sender);
                counterparts.sort((a, b) => b.price - a.price);

                if (counterparts.length == 0) {
                    console.log("No bids found");

                    return {
                        "type": "success",
                        "quantity": quantity
                    }
                }
                
                while(!finished) {
                    if (i == counterparts.length) {
                        finished = true;
                        continue;
                    }

                    const next = counterparts[i++];

                    if (next.price < order.price && !order.now) {
                        finished = true;
                        continue;
                    }

                    if (next.quantity > quantity) {
                        error = self.transferShares(sender, next.sender, quantity, next.price, order, sender, next);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        error = self.changeOrder(next.id, quantity);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        quantity = 0;
                        finished = true;
                        continue;
                    } else if (next.quantity == quantity) {
                        error = self.transferShares(sender, next.sender, quantity, next.price, order, sender, next);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        error = self.removeOrder(next.id);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        quantity = 0;
                        finished = true;
                        continue;
                    } else {
                        error = self.transferShares(sender, next.sender, next.quantity, next.price, order, sender, next);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        error = self.removeOrder(next.id);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        quantity -= next.quantity;
                    }
                }
                break;
            case "bid":
                counterparts = this.orders.filter(o => o.type == "ask" && o.sender != sender);
                counterparts.sort((a, b) => a.price - b.price);

                if (counterparts.length == 0) {
                    console.log("No asks found");

                    return {
                        "type": "success",
                        "quantity": quantity
                    }
                }

                while(!finished) {
                    if (i == counterparts.length) {
                        finished = true;
                        continue;
                    }

                    const next = counterparts[i++];

                    if (next.price > order.price && !order.now) {
                        finished = true;
                        continue;
                    }

                    if (next.quantity > quantity) {
                        error = self.transferShares(next.sender, sender, quantity, next.price, order, sender, next);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        error = self.changeOrder(next.id, quantity);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        quantity = 0;
                        finished = true;
                        continue;
                    } else if (next.quantity == quantity) {
                        error = self.transferShares(next.sender, sender, quantity, next.price, order, sender, next);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        error = self.removeOrder(next.id);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        quantity = 0;
                        finished = true;
                        continue;
                    } else {
                        error = self.transferShares(next.sender, sender, next.quantity, next.price, order, sender, next);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        error = self.removeOrder(next.id);
                        if (error != null) {
                            return {
                                "type": "error",
                                "message": error
                            }
                        }
                        quantity -= next.quantity;
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
            "quantity": quantity
        }
    }

    transferShares (from, to, quantity, price, order, actor, next = null) {
        const self = this;

        const actorPlayer= this.game.players.find(p => p.number === actor); 
        const fromPlayer = this.game.players.find(p => p.number === from);

        if (fromPlayer == null) {
            return `Player ${from} (from), not found`;
        }

        const toPlayer = this.game.players.find(p => p.number === to);

        if (toPlayer == null) {
            return `Player ${to} (to), not found`;
        }

        if (fromPlayer.wallet.shares < quantity) {
            return `Player ${from} (from), does not have the shares to complete the operation: ${fromPlayer.wallet.shares} < ${quantity}`;
        }

        if (toPlayer.wallet.balance < quantity * price + this.buyerTransactionCost) {
            return `Player ${to} (to), does not have the funds to complete the operation: ${toPlayer.wallet.balance} < ${quantity * price + this.buyerTransactionCost}`;
        }

        if (fromPlayer.wallet.balance + quantity * price < this.sellerTransactionCost) {
            return `Player ${from} (from), does not have the funds to complete the operation: ${fromPlayer.wallet.balance + quantity * price} < ${this.sellerTransactionCost}`;
        }

        console.log(fromPlayer);
        console.log(toPlayer);

        fromPlayer.wallet.shares -= quantity;
        fromPlayer.wallet.balance += quantity * price - this.sellerTransactionCost;

        self.results.log.push({
            "id": PostOrderHandler.nextLogEntryId++,
            "orderId": order.id,
            "time": new Date(),
            "round": self.game.currentRound.number,
            "phase": 6,
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
            "quantity": quantity,
            "price": price,
            "bestBid": self.getBestBid(),
            "bestAsk": self.getBestAsk(),
            "book": self.printBook(),
            "buyerFee": this.buyerTransactionCost,
            "sellerFee": this.sellerTransactionCost
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
                    "total": quantity * price - this.sellerTransactionCost,
                    "buyerFee": this.buyerTransactionCost,
                    "sellerFee": this.sellerTransactionCost
                },
                "balance": fromPlayer.wallet.balance,
                "shares" : fromPlayer.wallet.shares
            }
        );

        toPlayer.wallet.shares += quantity;
        toPlayer.wallet.balance -= quantity * price + this.buyerTransactionCost;

        this.wss.sendEvent(
            this.game.id,
            toPlayer.number,
            "asset-movement",
            {
                "movement": {
                    "type": "purchase",
                    "quantity": quantity,
                    "price": price,
                    "total": quantity * price - this.buyerTransactionCost,
                    "buyerFee": this.buyerTransactionCost,
                    "sellerFee": this.sellerTransactionCost
                },
                "balance": toPlayer.wallet.balance,
                "shares" : toPlayer.wallet.shares
            }
        );

        this.movementList.push({
            "movement": {
                "order": self.orderList[self.orderList.length - 1],
                "quantity": quantity,
                "price": price,
                "total": quantity * price,
                "buyerFee": this.buyerTransactionCost,
                "sellerFee": this.sellerTransactionCost
            },
            "from": {
                "number": fromPlayer.number,
                "balance": fromPlayer.wallet.balance,
                "shares" : fromPlayer.wallet.shares
            },
            "to": {
                "number": toPlayer.number,
                "balance": toPlayer.wallet.balance,
                "shares" : toPlayer.wallet.shares
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
                "buyerFee": this.buyerTransactionCost,
                "sellerFee": this.sellerTransactionCost,
                "median": medianLastSeven
            }
        );

        /*console.log(`Median last 7: ${medianLastSeven}`);

        console.log(fromPlayer);
        console.log(toPlayer);*/
    }

    removeOrder (id) {
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

    changeOrder (id, quantity) {
        const order = this.orders.find(o => o.id == id);

        if (order == null) {
            return `Order with id = ${id} not found`;
        }

        if (order.quantity <= quantity) {
            return `Order ${id} has quantity ${order.quantity}, equal or less than ${quantity} requested for change. Should have been deleted instead.`;
        }

        order.quantity -= quantity;

        this.wss.broadcastEvent (
            this.game.id,
            "update-order",
            {
                "order": {
                    "id": id,
                    "type": order.type,
                    "quantity": order.quantity,
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

export default {
    create(game, wss) {
        return new MarketPhase(game, wss);
    }
}