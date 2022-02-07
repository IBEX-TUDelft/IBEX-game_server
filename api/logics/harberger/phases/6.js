import WS from '../../../helpers/websocket.js';
import Utils from '../../../helpers/utils.js';

export default {
    create(game, wss) {
        const phase = {
            game: game,
            wss: wss,
            orderList: [],
            movementList: [],
            orders: [],
            nextOrderId: 1,
            complete: false,
            results: {
                log: []
            },
            onEnter: async function () {
                console.log('PHASE 6');

                const self = this;

                self.wss.broadcastInfo(self.game.id, 'The trading phase has started');

                console.log(`Allowing ${self.game.parameters.minutes_for_trading} minutes for trading`);

                setTimeout(() => {
                    self.complete = true;
                }, 60 * 1000 * self.game.parameters.minutes_for_trading); //TODO use the configuration
            },
            onExit: async function () {
            },
            testComplete: async function () {
                return this.complete;
            },
            getData() {
                const self = this;

                return {
                    "orders": self.orderList,
                    "movements": self.movementList
                };
            },
            onMessage: async function(ws, message) {
                const handler = this.handlers.find(m => m.type === message.type);

                if (handler == null) {
                    WS.error(ws, `Game ${message.gameId} is full. You cannot join`);
                    return;
                }

                if (handler.role != null) {
                    if (!handler.role.includes(ws.player.role)) {
                        WS.error(ws, `Game ${message.gameId}: only ${handler.role} can send this message in this phase. You are ${ws.player.role}.`);
                        return;
                    }
                    
                    if (ws.player.role === 0) {
                        const verification = Utils.verifyJWT(message.token);
    
                        if (verification == null || verification.role != 0)  {
                            WS.error(ws, 'Could not verify your token');
                            return;
                        }
                    }
                }

                await handler.action(ws, message);

                return await this.testComplete();
            },
            getBestBid: function () {
                const bids = this.orders.filter(o => o.type === 'bid');

                if (bids == null || bids.length === 0) {
                    return null;
                }

                const bestBid = bids.reduce((prev, curr) => curr.price > prev.price ? curr : prev);

                return bestBid.price;
            },
            getBestAsk: function () {
                const asks = this.orders.filter(o => o.type === 'ask');

                if (asks == null || asks.length === 0) {
                    return null;
                }

                const bestAsk = asks.reduce((prev, curr) => curr.price < prev.price ? curr : prev);

                return bestAsk.price;
            },
            printBook: function() {
                const self = this;

                return JSON.stringify({
                    bids: self.orders.filter(o => o.type === 'bid').map(b => b.price),
                    asks: self.orders.filter(o => o.type === 'ask').map(a => a.price)
                });
            },
            init: function () {
                const self = this;

                this.handlers.push({
                    "type": "post-order",
                    "role": null,
                    "action": function(ws, message) {
                        const player = self.game.players.find(p => p.number === ws.player.number);

                        if (player == null) {
                            WS.error(ws, `Game ${message.gameId}: player ${ws.player.number} not found`);
                            return;
                        }

                        const order = message.order;

                        console.log(message);
                        console.log(order);

                        const nextOrder = {
                            "id": self.nextOrderId + 1,
                            "sender": player.number,
                            "price": order.price,
                            "quantity": order.quantity,
                            "type": order.type
                        };

                        self.orderList.push(nextOrder);
                        
                        self.results.log.push({
                            "id": nextOrder.id,
                            "time": new Date(),
                            "round": self.game.currentRound.number,
                            "phase": 6,
                            "actor": {
                                "number": player.number,
                                "role": player.role
                            },
                            "action": (order.type === 'ask' ? 'added Sell' : 'added Buy'),
                            "quantity": order.quantity,
                            "price": order.now ? 'any' : order.price,
                            "bestBid": self.getBestBid(),
                            "bestAsk": self.getBestAsk(),
                            "book": self.printBook()
                        });

                        const result = self.fulfillOrder(order, player.number);

                        if (result.type == "error") {
                            WS.error(ws, `Game ${message.gameId}, could not fulfill your order: ${result.message}`);
                        }

                        if (result.quantity > 0 && !order.now) {
                            const nextId = self.nextOrderId;
                            self.nextOrderId ++;

                            const newOrder = {
                                "id": nextId,
                                "sender": player.number,
                                "price": order.price,
                                "quantity": result.quantity,
                                "type": order.type
                            };

                            self.orders.push(newOrder);

                            self.wss.broadcastEvent (
                                self.game.id,
                                "add-order",
                                {
                                    "order": newOrder
                                }
                            );
                        }
                    }
                }, {
                    "type": "cancel-order",
                    "role": null,
                    "action": function(ws, message) {
                        const player = self.game.players.find(p => p.number === ws.player.number);

                        if (player == null) {
                            WS.error(ws, `Game ${message.gameId}: player ${ws.player.number} not found`);
                            return;
                        }

                        const order = self.orders.find(o => o.id === message.order.id);

                        if (order == null) {
                            WS.error(ws, `Order not found. ${message.order.id}`);
                            return;
                        }

                        if (order.sender != player.number) {
                            WS.error(ws, `You cannot delete this order because you did not create it`);
                            return;
                        }

                        self.results.log.push({
                            "id": order.id,
                            "time": new Date(),
                            "round": self.game.currentRound.number,
                            "phase": 6,
                            "actor": {
                                "number": player.number,
                                "role": player.role
                            },
                            "action": (order.type === 'ask' ? 'Cancel Sell Order' : 'Cancel Buy Order'),
                            "quantity": order.quantity,
                            "price": order.price,
                            "bestBid": self.getBestBid(),
                            "bestAsk": self.getBestAsk(),
                            "book": self.printBook()
                        });

                        const err = self.removeOrder (order.id);

                        self.orderList.push({
                            "id": message.order.id,
                            "type": "cancel"
                        });

                        if (err != null) {
                            WS.error(ws, err);
                            return;
                        }
                    }
                }, {
                    "type": "complete-market-phase",
                    "role": null,
                    "action": function(ws, message) {
                        console.log('Received');

                        self.complete = true;
                    }
                });
            },
            fulfillOrder(order, sender) {
                const self = this;

                let counterparts;

                let finished = false;
                let quantity = order.quantity;
                let i = 0;
                let error = null;

                switch(order.type) {
                    case "ask":
                        counterparts = this.orders.filter(o => o.type == "bid");
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
                                error = self.transferShares(sender, next.sender, quantity, next.price, order, sender);
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
                                error = self.transferShares(sender, next.sender, quantity, next.price, order, sender);
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
                                error = self.transferShares(sender, next.sender, next.quantity, next.price, order, sender);
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
                        counterparts = this.orders.filter(o => o.type == "ask");
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
                                error = self.transferShares(next.sender, sender, quantity, next.price, order, sender);
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
                                error = self.transferShares(next.sender, sender, quantity, next.price, order, sender);
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
                                error = self.transferShares(next.sender, sender, next.quantity, next.price, order, sender);
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
            },
            transferShares (from, to, quantity, price, order, actor) {
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

                if (fromPlayer.shares < quantity) {
                    return `Player ${from} (from), does not have the shares to complete the operation: ${fromPlayer.shares} < ${quantity}`;
                }

                if (toPlayer.balance < quantity * price) {
                    return `Player ${to} (to), does not have the funds to complete the operation: ${toPlayer.balance} < ${quantity * price}`;
                }

                console.log(fromPlayer);
                console.log(toPlayer);

                fromPlayer.shares -= quantity;
                fromPlayer.balance += quantity * price;

                self.results.log.push({
                    "id": order.id,
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
                        "balance": fromPlayer.balance,
                        "shares" : fromPlayer.shares
                    }
                );

                toPlayer.shares += quantity;
                toPlayer.balance -= quantity * price;

                this.wss.sendEvent(
                    this.game.id,
                    toPlayer.number,
                    "asset-movement",
                    {
                        "movement": {
                            "type": "purchase",
                            "quantity": quantity,
                            "price": price,
                            "total": quantity * price
                        },
                        "balance": toPlayer.balance,
                        "shares" : toPlayer.shares
                    }
                );

                self.wss.broadcastEvent (
                    self.game.id,
                    "contract-fulfilled",
                    {
                        "from": fromPlayer.number,
                        "to": toPlayer.number,
                        "price": price
                    }
                );

                this.movementList.push({
                    "movement": {
                        "order": self.orderList[self.orderList.length - 1],
                        "quantity": quantity,
                        "price": price,
                        "total": quantity * price
                    },
                    "from": {
                        "number": fromPlayer.number,
                        "balance": fromPlayer.balance,
                        "shares" : fromPlayer.shares
                    },
                    "to": {
                        "number": toPlayer.number,
                        "balance": toPlayer.balance,
                        "shares" : toPlayer.shares
                    }
                });

                console.log(fromPlayer);
                console.log(toPlayer);
            },
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
            },
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
                            "quantity": order.quantity
                        }
                    }
                );
            },
            handlers: []
        }

        phase.init();

        return phase;
    }
}