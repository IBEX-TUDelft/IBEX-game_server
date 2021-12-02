<template>
    <div class="row mt-1 mx-5 mp-1">
        <div class="col-6">
            <div class="container">

                <div class="row-12 mb-1">
                    <table class="table table-bordered text-center">
                        <tr>
                            <td>Condition</td><td>{{ getWinningCondition() }}</td>
                        </tr>
                        <tr>
                            <td>Public Signal</td><td>TBD</td>
                        </tr>
                        <tr>
                            <td>Private Signal</td><td>{{ formatNumber($parent.player.signals[$parent.game.winningCondition]) }}</td>
                        </tr>
                        <tr>
                            <td>Median Price</td><td>{{ getMedianPrice() }}</td>
                        </tr>
                    </table>
                </div>

                <div class="row mb-1">
                    <div class="offset-md-1 col-3">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("ask", false)'>Ask</button>
                    </div>
                    <div class="col-4">
                        <input type="number" class="form-control" v-model="ask_price" name="ask_price" id="ask_price" aria-describedby="emailHelp" placeholder="10" />
                    </div>
                </div>

                <div class="row mb-1">
                    <div class="offset-md-1 col-3 d-flex align-items-end mb-3">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("bid", true)'>Buy @ -></button>
                    </div>
                    <div class="col-4">
                        <table class="table table-bordered text-center">
                            <tr v-for="ask in asks" :key="ask.id">
                                <td>{{ formatNumber(ask.price) }}{{ask.sender == $parent.player.number ? '*' : ''}}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-3 d-flex align-items-end mb-3">
                        <button type="button" class="btn btn-primary btn-block" @click='removeLastAsk()'>Remove Ask</button>
                    </div>
                </div>

                <div class="row mb-1">
                    <div class="offset-md-1 col-3">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("ask", true)'>Sell @ -></button>
                    </div>
                    <div class="col-4">
                        <table class="table table-bordered text-center">
                            <tr v-for="bid in bids" :key="bid.id">
                                <td>{{ formatNumber(bid.price) }}{{bid.sender == $parent.player.number ? '*' : ''}}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-3">
                        <button type="button" class="btn btn-primary btn-block" @click='removeLastBid()'>Remove Bid</button>
                    </div>
                </div>

                <div class="row mb-1">
                    <div class="offset-md-1 col-3">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("bid", false)'>Bid</button>
                    </div>
                    <div class="col-4">
                        <input type="number" class="form-control" v-model="bid_price" name="bid_price" id="bid_price" aria-describedby="emailHelp" placeholder="10" />
                    </div>
                </div>

                <div class="row">
                    <table class="table table-bordered text-center">
                        <tr>
                            <td>Cash</td><td>{{ $parent.player.balance }}</td>
                        </tr>
                        <tr>
                            <td>Shares</td><td>{{ $parent.player.shares }}</td>
                        </tr>
                    </table>
                </div>
            </div>

        </div>

        <div class="col-6">

            <div class="row-12">
                <div class="text-center"><b>Contracts</b></div>
                <table class="table table-bordered text-center">
                    <thead>
                        <th scope="col" style="width: 33%">Status Quo</th>
                        <th scope="col" style="width: 33%">Project A</th>
                        <th scope="col" style="width: 33%">Project B</th>
                    </thead>
                    <tbody>
                        <tr v-for="contract in contracts" :key="contract.id">
                            <td>{{ $parent.game.winningCondition === 0 ? (formatNumber(contract.price) + ((contract.from == $parent.player.number) || (contract.to == $parent.player.number) ? '*' : '')) : ''}}</td>
                            <td>{{ $parent.game.winningCondition === 1 ? (formatNumber(contract.price) + ((contract.from == $parent.player.number) || (contract.to == $parent.player.number) ? '*' : '')) : ''}}</td>
                            <td>{{ $parent.game.winningCondition === 2 ? (formatNumber(contract.price) + ((contract.from == $parent.player.number) || (contract.to == $parent.player.number) ? '*' : '')) : ''}}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
    </div>
</template>

<script>

const conditionMap = {
    0: "No Project",
    1: "Project A",
    2: "Project B",
}

export default {
    data() {
        return {
            asks: [],
            bids: [],
            ask_quantity: 0,
            ask_price: 0,
            ask_now: 0,
            bid_quantity: 0,
            bid_price: 0,
            bid_now: "no",
            contracts: []
        }
    },
    name: 'DoubleAuctionMarket',
    methods: {
        removeLastAsk() {
            const last = this.asks.reduce((p,n) => p.id >= n.id ? p : n);

            if (last != null) {
                this.sendMessage("cancel-order", {
                    "order": {
                        "id": last.id
                    }
                });
            }
        },
        removeLastBid() {
            const last = this.bids.reduce((p,n) => p.id >= n.id ? p : n);

            if (last != null) {
                this.sendMessage("cancel-order", {
                    "order": {
                        "id": last.id
                    }
                });
            }
        },
        removeOrder(id) {
            this.sendMessage("cancel-order", {
                "order": {
                    "id": id
                }
            });
        },
        postOrder(type, now) {
            const self = this;
            const player = self.$parent.player;
            let order;

            switch(type) {
                case "ask":
                    if (player.shares < 1) {
                        self.pushMessage("warning", `You need 1 shares to do this, you only have ${player.shares}`);
                        return;
                    }

                    order = {
                        "price": parseFloat(self.ask_price),
                        "quantity": 1,
                        "type": type,
                        "now": now
                    }

                    break;
                case "bid":
                    if (player.balance < self.bid_price) {
                        self.pushMessage("warning", `You need ${self.bid_price} coins to buy 1 share
                        at ${self.ask_price} per share, you only have ${player.balance}`);
                        return;
                    }

                    order = {
                        "price": parseFloat(self.bid_price),
                        "quantity": 1,
                        "type": type,
                        "now": now
                    }

                    break;
                default:
                    throw new Error(`Type was ${type}. Can be only ask|bid`);
            }

            console.log(order);

            this.sendMessage("post-order", {
                "order": order
            });
        },
        pushMessage(type, content) {
            this.$parent.pushMessage(type, content);
        },
        formatNumber(num) {
            return this.$parent.formatNumber(num);
        },
        sendMessage(type, msg) {
            msg.gameId = this.$parent.game.id;
            msg.type = type;

            console.log(msg);
            this.$parent.connection.send(JSON.stringify(msg));
        },
        getWinningCondition() {
            return conditionMap[this.$parent.game.winningCondition];
        },
        getMedianPrice() {
            if (this.contracts.length === 0) {
                return '-';
            }

            let sum = 0;

            for (let i = 0; i < this.contracts.length; i++) {
                sum += this.contracts[i].price;
            }

            return this.formatNumber(sum / this.contracts.length);
        },
        orderEvent(order, eventType) {
            let list;

            console.log(eventType);
            console.log(order);

            if (eventType == "contract") {
                order.type = "contract";
            }

            switch(order.type) {
                case "ask":
                    list = this.asks;
                    break;
                case "bid":
                    list = this.bids;
                    break;
                case "contract":
                    order.id = this.contracts.length;

                    this.contracts.push(order);

                    return;
                default:
                    throw new Error(`Type was ${order.type}. Can be only ask|bid`);
            }

            const existing = list.find(o => o.id == order.id);

            switch(eventType) {
                case "add": {
                    if (existing != null) {
                        console.log(`Ignoring ${order.type} add ${order.id}: the order is already there`);
                        return;
                    }

                    const newOrder = {
                        id: order.id,
                        price: order.price,
                        quantity: order.quantity,
                        sender: order.sender
                    };

                    switch(order.type) {
                        case "ask":
                            this.asks.push(newOrder);
                            break;
                        case "bid":
                            this.bids.push(newOrder);
                            break;
                        default:
                            throw new Error(`Type was ${order.type}. Can be only ask|bid`);
                    }
                    
                    break;
                }
                case "delete": {
                    if (existing == null) {
                        console.log(`Ignoring ${order.type} delete ${order.id}: the order was not found there`);
                        return;
                    }
                    list.splice(list.indexOf(existing), 1);
                    break;
                }
                case "update": {
                    if (existing == null) {
                        console.log(`Ignoring ${order.type} update ${order.id}: the order was not found there`);
                        return;
                    }
                    existing.quantity = order.quantity;
                    break;
                }
                default:
                    throw new Error(`Event type was ${order.eventType}. Can be only add|delete|update`);
            }

            switch(order.type) {
                case "ask":
                    list.sort((a, b) => b.price - a.price);
                    break;
                case "bid":
                    list.sort((a, b) => b.price - a.price);
                    break;
                default:
                    throw new Error(`Type was ${order.type}. Can be only ask|bid`);
            }
        }
    }
}
</script>
