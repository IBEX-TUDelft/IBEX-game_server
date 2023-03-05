import WS from '../../../helpers/websocket.js';
import JoinablePhase from '../../JoinablePhase.js';

class Phase6 extends JoinablePhase {

    orderList = [[],[],[]];
    movementList = [[],[],[]];
    orders = [[],[],[]];
    nextOrderId = [1,1,1];
    complete = false;
    results = {
        snipes: [],
        snipeOutcomes: [],
        log: [[],[],[]],
        winningCondition: null,
        wallets: [],
        finalPrices: []
    }

    constructor(game, wss) {
        super (game, wss, [{
            "type": "post-order",
            "role": null,
            "action": function(ws, message, player, phase) {
                const order = message.order;

                console.log(message);
                console.log(order);

                if (order == null) {
                    WS.error(ws, `Game ${message.gameId}: the order is null`);
                    return;
                }

                const condition = order.condition;

                if (!game.conditions.map(c => c.id).includes(condition)) {
                    WS.error(ws, `Game ${message.gameId}: condition not understood: ${condition}`);
                    return;
                }

                if (order.price  == null) {
                    wss.sendEvent(
                        game.id,
                        player.number,
                        'order-refused',
                        {
                            "message": `Order price was not filled.`,
                            "placeholder": "order-price-missing"
                        }
                    );
                    return; //Cannot ask or bid negative numbers
                }

                if (typeof order.price != 'number') {
                    order.price = parseFloat(order.price);
                }

                if (order.price < 0) {
                    wss.sendEvent(
                        game.id,
                        player.number,
                        'order-refused',
                        {
                            "message": `Order prices must be non negative. Your price: ${order.price}`,
                            "placeholder": "order-price-negative",
                            "parameters": [order.price]
                        }
                    );
                    return; //Cannot ask or bid negative numbers
                }

                if (order.type === 'ask') {
                    const activeAsksForCondition = phase.orders[condition].filter(o => o.sender === player.number && o.type === 'ask').length;

                    if (player.wallet[condition].shares <= activeAsksForCondition) {
                        wss.sendEvent(
                            game.id,
                            player.number,
                            'order-refused',
                            {
                                "message": `You have already committed all your shares ${player.wallet[condition].shares} in other asks.
                                 You can cancel them if you want to publish new ones`,
                                "placeholder": "no-shares-available",
                                "parameters": [player.wallet[condition].shares]
                            }
                        );
                        return; //Cannot have more asks than shares
                    }
                } else if (order.type === 'bid') {
                    const committedSumForCondition = phase.orders[condition].filter(o => o.sender === player.number && o.type === 'bid')
                        .map(o => o.price)
                        .reduce((a, b) => a + b, 0);

                    if (player.wallet[condition].balance - order.price < committedSumForCondition) {
                        const remainder = player.wallet[condition].balance - committedSumForCondition;

                        wss.sendEvent(
                            game.id,
                            player.number,
                            'order-refused',
                            {
                                "message": `You have already committed much of your balance (${committedSumForCondition}) in other bids,
                                 The remainder ${remainder} is not enough to bid ${order.price}. 
                                 You may cancel previous bids to free some of your balance.`,
                                "placeholder": "no-balance-available",
                                "parameters": [committedSumForCondition, remainder, order.price]
                            }
                        );

                        return; //The sum of the bids (including the coming one) cannot exceed the balance
                    }
                }

                const nextOrder = {
                    "id": phase.nextOrderId[condition] + 1,
                    "sender": player.number,
                    "price": order.price,
                    "quantity": order.quantity,
                    "type": order.type,
                    "condition": condition
                };

                phase.orderList[condition].push(nextOrder);
                
                phase.results.log[condition].push({
                    "id": nextOrder.id,
                    "time": new Date(),
                    "round": game.currentRound.number,
                    "phase": 6,
                    "actor": {
                        "number": player.number,
                        "role": player.role
                    },
                    "action": (order.type === 'ask' ? 'added Sell' : 'added Buy'),
                    "quantity": order.quantity,
                    "price": order.now ? 'any' : order.price,
                    "bestBid": phase.getBestBid(condition),
                    "bestAsk": phase.getBestAsk(condition),
                    "book": phase.printBook(condition)
                });

                const result = phase.fulfillOrder(order, player.number);

                if (result.type == "error") {
                    wss.sendEvent(
                        game.id,
                        player.number,
                        'order-refused',
                        {
                            "message": `Could not fulfill your order: ${result.message}`
                        }
                    );
                    //WS.error(ws, `Game ${message.gameId}, could not fulfill your order: ${result.message}`);
                }

                if (result.quantity > 0) {
                    if (!order.now) {
                        const nextId = phase.nextOrderId[condition];
                        phase.nextOrderId[condition] ++;

                        const newOrder = {
                            "id": nextId,
                            "sender": player.number,
                            "price": order.price,
                            "quantity": result.quantity,
                            "type": order.type,
                            "condition": condition
                        };

                        phase.orders[condition].push(newOrder);

                        wss.broadcastEvent (
                            game.id,
                            "add-order",
                            {
                                "order": newOrder
                            }
                        );
                    } else {
                        if (order.type === 'ask') {
                            wss.sendEvent(
                                game.id,
                                player.number,
                                'order-refused',
                                {
                                    "message": `Could not fulfill your order: ${result.message}`,
                                    "placeholder": "could-not-find-bids"
                                }
                            );
                        } else if (order.type === 'bid') {
                            wss.sendEvent(
                                game.id,
                                player.number,
                                'order-refused',
                                {
                                    "message": `Could not fulfill your order: ${result.message}`,
                                    "placeholder": "could-not-find-asks"
                                }
                            );
                        }
                    }
                }
            }
        }, {
            "type": "cancel-order",
            "role": null,
            "action": function(ws, message, player, phase) {
                const condition = message.order.condition;
                
                if (!game.conditions.map(c => c.id).includes(condition)) {
                    WS.error(ws, `Game ${message.gameId}: condition not understood: ${condition}`);
                    return;
                }

                const order = phase.orders[condition].find(o => o.id === message.order.id);

                if (order == null) {
                    WS.error(ws, `Order not found. ${message.order.id}`);
                    return;
                }

                if (order.sender != player.number) {
                    WS.error(ws, `You cannot delete this order because you did not create it`);
                    return;
                }

                phase.results.log[condition].push({
                    "id": order.id,
                    "time": new Date(),
                    "round": game.currentRound.number,
                    "phase": 6,
                    "actor": {
                        "number": player.number,
                        "role": player.role
                    },
                    "action": (order.type === 'ask' ? 'Cancel Sell Order' : 'Cancel Buy Order'),
                    "quantity": order.quantity,
                    "price": order.price,
                    "bestBid": phase.getBestBid(condition),
                    "bestAsk": phase.getBestAsk(condition),
                    "book": phase.printBook(condition)
                });

                const err = phase.removeOrder(order.id, condition);

                phase.orderList[condition].push({
                    "id": message.order.id,
                    "type": "cancel"
                });

                if (err != null) {
                    WS.error(ws, err);
                    return;
                }
            }
        }], [
            'Trade shares, they represent a percentage of the final taxes on the winning project'
        ]);
    }

    async onEnter () {
        await super.onEnter();

        const self = this;

        console.log(`Allowing ${self.game.parameters.minutes_for_trading} minutes for trading`);

        this.setTimer(60 * 1000 * self.game.parameters.minutes_for_trading, 60 * 1000 * self.game.parameters.minutes_for_trading);
    }

    async onExit () {
        await super.onExit();

        const self = this;

        this.results.wallets.push(...this.game.players.map(p => {
            return {
                "number": p.number,
                "wallet": p.wallet
            };
        }));

        self.game.conditions.forEach(condition => {
            self.results.finalPrices.push(self.medianLastSeven(condition.id));
        });

        let err = this.wss.broadcastEvent(
            self.game.id,
            "reset-timer",
            {}
        );

        if (err != null) {
            console.log(err);
        }

        // 1 Determine the winning condition based on the final market price
        this.game.quotations = [0, 0, 0];

        let winningCondition = 0; //If no trades are made, the status quo wins
        let winningQuotation = 0;

        for (let condition = 0; condition < self.game.conditions.length; condition++) {
            const median = this.medianLastSeven(condition);

            if (median == null) {
                continue;
            }

            if (median > winningQuotation) {
                winningQuotation = median;
                winningCondition = condition;
            }
        }

        console.log(this.game.quotations);

        this.game.winningCondition = winningCondition;

        this.results.winningCondition = winningCondition;

        console.log(`The winning condition is ${winningCondition}, with a median price of ${winningQuotation}. Here the full list: ${this.game.quotations}`);

        err = self.wss.broadcastEvent(
            self.game.id,
            "winning-condition",
            {
                "winningCondition": winningCondition
            }
        );

        if (err != null) {
            console.log(err);
        }

        //2 Resolve the sniping session from phase 3

        self.wss.broadcastInfo(self.game.id, 'Reconciliation in progress ...');

        self.game.properties.forEach(p => {
            try {
                console.log('Creating land profit bill');

                const landProfit = {
                    "round": self.game.currentRound.number,
                    "phase": 4,
                    "property": p.id,
                    "condition": winningCondition,
                    "value": p.v[winningCondition],
                    "declaration": p.d[winningCondition],
                    "sniped": false,
                    "speculator": null,
                    "snipeProfit": 0,
                    "taxes": p.d[winningCondition] * self.game.parameters.tax_rate_initial / 100
                }

                console.log('Current land profit');
                console.log(landProfit);

                const owner = self.game.players.find(pl => pl.number === p.owner);

                if (owner == null) {
                    console.log(`Player number ${p.owner} not found`);
                    return;
                }

                if (p.speculators != null && p.speculators.find(s => s.length > 0) != null) {
                    console.log('There are speculators');

                    const biddingSpeculators = p.speculators[winningCondition];

                    const speculationProfit = (p.v[winningCondition] - p.d[winningCondition]) / (2  * biddingSpeculators.length);

                    landProfit.sniped = true;
                    landProfit.speculator = biddingSpeculators;
                    landProfit.snipeProfit = speculationProfit;

                    for (let i = 0; i < self.game.players.length; i++) {
                        const speculator = self.game.players[i];

                        if (!p.speculators[winningCondition].includes(speculator.number)) {
                            continue;
                        }

                        if (speculator.profit == null) {
                            speculator.profit =  [];
                        }

                        self.results.snipes.push( {
                            "player": {
                                "number": speculator.number,
                                "role": speculator.role
                            },
                            "target": {
                                "number": owner.number,
                                "role": owner.role
                            },
                            "snipes": [
                                p.speculators[0].includes(speculator.number),
                                p.speculators[1].includes(speculator.number),
                                p.speculators[2].includes(speculator.number),
                            ],
                            "executed": true//speculator.number === winnerNumber
                        });

                        self.results.snipeOutcomes.push( {
                            "player": {
                                "number": speculator.number,
                                "role": speculator.role
                            },
                            "target": {
                                "number": owner.number,
                                "role": owner.role
                            },
                            "profit": speculationProfit
                        });

                        speculator.profit.push({
                            "phase": 4,
                            "amount": speculationProfit,
                            "context": {
                                "type": "speculation",
                                "property": {
                                    "id": p.id,
                                    "name": p.name
                                },
                                "condition": winningCondition
                            }
                        });

                        console.log('Profit added to the speculator');

                        self.wss.sendEvent(
                            self.game.id,
                            speculator.number,
                            "profit",
                            {
                                "round": self.game.currentRound.number,
                                "owner": owner.number,
                                "sniped": true,
                                "snipeProfit": speculationProfit,
                                "condition": winningCondition,
                                "declaration": p.d[winningCondition]
                            }
                        );
                    }
                }

                console.log('Done with speculators');

                console.log('Owner found');
                console.log(owner);

                landProfit.owner = owner.number;
                landProfit.role = owner.role;

                landProfit.total = landProfit.value - landProfit.taxes - landProfit.snipeProfit;

                if (owner.profit == null) {
                    owner.profit =  [];
                }

                owner.profit.push({
                    "phase": 4,
                    "amount": landProfit.total,
                    "context": {
                        "type": "speculation",
                        "property": {
                            "id": p.id,
                            "name": p.name
                        },
                        "condition": winningCondition
                    }
                });

                console.log('Added profit to owner');

                self.wss.sendEvent(
                    self.game.id,
                    owner.number,
                    "profit",
                    landProfit
                );

                console.log('Sent message to owner');
            } catch(e) {
                console.error(e);
            }
        });

        this.game.properties.forEach(p => { p.speculators = null; });
        this.game.players.filter(p => p.role === 1).forEach(p => { p.doneSpeculating = false; });

        this.game.players.forEach(player => {
            const firstSnipes = self.results.snipeOutcomes
                .filter(so => so.player.number === player.number || so.target.number === player.number);

            self.wss.sendEvent(
                self.game.id,
                player.number,
                "first-snipes",
                {
                    "snipes": firstSnipes
                }
            );
        });
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

    getBestBid (condition) {
        if (![0,1,2].includes(condition)) {
            throw new Error(`Condition not understood: ${condition}`);
        }

        const bids = this.orders[condition].filter(o => o.type === 'bid');

        if (bids == null || bids.length === 0) {
            return null;
        }

        const bestBid = bids.reduce((prev, curr) => curr.price > prev.price ? curr : prev);

        return bestBid.price;
    }

    getBestAsk (condition) {
        if (![0,1,2].includes(condition)) {
            throw new Error(`Condition not understood: ${condition}`);
        }

        const asks = this.orders[condition].filter(o => o.type === 'ask');

        if (asks == null || asks.length === 0) {
            return null;
        }

        const bestAsk = asks.reduce((prev, curr) => curr.price < prev.price ? curr : prev);

        return bestAsk.price;
    }

    printBook (condition) {
        if (![0,1,2].includes(condition)) {
            throw new Error(`Condition not understood: ${condition}`);
        }

        const self = this;

        return JSON.stringify({
            bids: self.orders[condition].filter(o => o.type === 'bid').map(b => b.price),
            asks: self.orders[condition].filter(o => o.type === 'ask').map(a => a.price)
        });
    }

    fulfillOrder (order, sender) {
        const self = this;

        const condition = order.condition;

        let counterparts;

        let finished = false;
        let quantity = order.quantity;
        let i = 0;
        let error = null;

        switch(order.type) {
            case "ask":
                counterparts = this.orders[condition].filter(o => o.type == "bid" && o.sender != sender);
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
                        error = self.changeOrder(next.id, quantity, condition);
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
                        error = self.removeOrder(next.id, condition);
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
                        error = self.removeOrder(next.id, condition);
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
                counterparts = this.orders[condition].filter(o => o.type == "ask" && o.sender != sender);
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
                        error = self.changeOrder(next.id, quantity, condition);
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
                        error = self.removeOrder(next.id, condition);
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
                        error = self.removeOrder(next.id, condition);
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

    transferShares (from, to, quantity, price, order, actor) {
        const self = this;

        const condition = order.condition;

        const actorPlayer= this.game.players.find(p => p.number === actor); 
        const fromPlayer = this.game.players.find(p => p.number === from);

        if (fromPlayer == null) {
            return `Player ${from} (from), not found`;
        }

        const toPlayer = this.game.players.find(p => p.number === to);

        if (toPlayer == null) {
            return `Player ${to} (to), not found`;
        }

        if (fromPlayer.wallet[condition].shares < quantity) {
            return `Player ${from} (from), does not have the shares to complete the operation: ${fromPlayer.wallet[condition].shares} < ${quantity}`;
        }

        if (toPlayer.wallet[condition].balance < quantity * price) {
            return `Player ${to} (to), does not have the funds to complete the operation: ${toPlayer.wallet[condition].balance} < ${quantity * price}`;
        }

        console.log(fromPlayer);
        console.log(toPlayer);

        fromPlayer.wallet[condition].shares -= quantity;
        fromPlayer.wallet[condition].balance += quantity * price;

        self.results.log[condition].push({
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
            "bestBid": self.getBestBid(condition),
            "bestAsk": self.getBestAsk(condition),
            "book": self.printBook(condition)
        });

        this.wss.sendEvent(
            this.game.id,
            fromPlayer.number,
            "asset-movement",
            {
                "condition": condition,
                "movement": {
                    "type": "sale",
                    "quantity": quantity,
                    "price": price,
                    "total": quantity * price
                },
                "balance": fromPlayer.wallet[condition].balance,
                "shares" : fromPlayer.wallet[condition].shares
            }
        );

        toPlayer.wallet[condition].shares += quantity;
        toPlayer.wallet[condition].balance -= quantity * price;

        this.wss.sendEvent(
            this.game.id,
            toPlayer.number,
            "asset-movement",
            {
                "condition": condition,
                "movement": {
                    "type": "purchase",
                    "quantity": quantity,
                    "price": price,
                    "total": quantity * price
                },
                "balance": toPlayer.wallet[condition].balance,
                "shares" : toPlayer.wallet[condition].shares
            }
        );

        this.movementList[condition].push({
            "movement": {
                "order": self.orderList[condition][self.orderList.length - 1],
                "quantity": quantity,
                "price": price,
                "total": quantity * price
            },
            "from": {
                "number": fromPlayer.number,
                "balance": fromPlayer.wallet[condition].balance,
                "shares" : fromPlayer.wallet[condition].shares
            },
            "to": {
                "number": toPlayer.number,
                "balance": toPlayer.wallet[condition].balance,
                "shares" : toPlayer.wallet[condition].shares
            }
        });

        const medianLastSeven = self.medianLastSeven(condition);

        console.log(`Median last 7 (Condition ${condition}): ${medianLastSeven}`);
        
        self.wss.broadcastEvent (
            self.game.id,
            "contract-fulfilled",
            {
                "from": fromPlayer.number,
                "to": toPlayer.number,
                "price": price,
                "condition": condition,
                "median": medianLastSeven
            }
        );

        console.log(fromPlayer);
        console.log(toPlayer);
    }

    removeOrder (id, condition) {
        const order = this.orders[condition].find(o => o.id == id);

        if (order == null) {
            return `Order with id = ${id} not found`;
        }

        this.orders[condition].splice(this.orders[condition].indexOf(order), 1);

        this.wss.broadcastEvent (
            this.game.id,
            "delete-order",
            {
                "order": {
                    "id": id,
                    "type": order.type,
                    "condition": condition
                }
            }
        );
    }

    changeOrder (id, quantity, condition) {
        const order = this.orders[condition].find(o => o.id == id);

        if (order == null) {
            return `Order with id = ${id} not found in condition ${condition}`;
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
                    "condition": condition
                }
            }
        );
    }

    medianLastSeven(condition) {
        const values = this.movementList[condition].map(m => m.movement.price).slice(-7);

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
        return new Phase6(game, wss);
    }
}