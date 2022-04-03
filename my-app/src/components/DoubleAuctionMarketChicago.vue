<template>
    <div class="row mt-1 mx-5 mp-1">
        <div class="col-6">
            <div class="container">
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
                    <div class="col-4" style="height: 300px; display: flex; flex-direction: column-reverse; border: 1px solid; overflow: scroll;">
                        <table class="table table-bordered text-center" style="margin-top: auto; margin-bottom: 0px;">
                            <tr v-for="ask in asks" :key="ask.id">
                                <td>{{ formatUs(ask.price) }}{{ask.sender == player.number ? '*' : ''}}</td>
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
                    <div class="col-4" style="height: 300px; border: 1px solid; overflow: scroll;">
                        <table class="table table-bordered text-center">
                            <tr v-for="bid in bids" :key="bid.id">
                                <td>{{ formatUs(bid.price) }}{{bid.sender == player.number ? '*' : ''}}</td>
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
            </div>

        </div>

        <div class="col-6">

            <div class="row-12 mb-1">
                <table class="table table-bordered text-center">
                    <tr>
                        <td>Condition</td><td>{{ conditionName }}</td>
                        <td>Median Price</td><td>{{ formatUs(getMedianPrice()) }}</td>
                    </tr>
                    <tr>
                        <td>Publ. Signal</td><td>{{ formatUs(game.publicSignal[condition]) }}</td>
                        <td>Priv. Signal</td><td>{{ formatUs(player.signals[condition]) }}</td>
                    </tr>
                    <tr>
                        <td>Balance</td><td>{{ formatUs(player.wallet[condition].balance) }}</td>
                        <td>Shares</td><td>{{ player.wallet[condition].shares }}</td>
                    </tr>
                </table>
            </div>

            <div class="row-12">
                <div class="text-center"><b>Contracts</b></div>
                <table class="table table-bordered text-center">
                    <tbody>
                        <tr v-for="contract in contracts" :key="contract.id">
                            <td>{{ formatUs(contract.price) + ((contract.from == player.number) || (contract.to == player.number) ? '*' : '') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: ['condition', 'conditionName', 'player', 'game', 'pushMessage', 'connection', 'formatNumber'],
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
        completeMarketPhase() {
            this.sendMessage("complete-market-phase", {});
        },
        removeLastAsk() {
            const self = this;

            const last = this.asks.filter(a => a.sender == self.$props.player.number).reduce((p,n) => p.id >= n.id ? p : n);

            if (last != null) {
                this.sendMessage("cancel-order", {
                    "order": {
                        "id": last.id,
                        "condition": self.$props.condition
                    }
                });
            }
        },
        removeLastBid() {
            const self = this;

            const last = this.bids.filter(b => b.sender == self.$props.player.number).reduce((p,n) => p.id >= n.id ? p : n);

            if (last != null) {
                this.sendMessage("cancel-order", {
                    "order": {
                        "id": last.id,
                        "condition": self.$props.condition
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

            let order;

            switch(type) {
                case "ask":
                    if (self.$props.player.shares < 1) {
                        self.pushMessage("warning", `You need 1 shares to do this, you only have ${self.$props.player.shares}`);
                        return;
                    }

                    order = {
                        "price": parseFloat(self.ask_price),
                        "quantity": 1,
                        "condition": self.$props.condition,
                        "type": type,
                        "now": now
                    }

                    break;
                case "bid":
                    if (self.$props.player.balance < self.bid_price) {
                        self.pushMessage("warning", `You need ${self.bid_price} coins to buy 1 share
                        at ${self.ask_price} per share, you only have ${self.$props.player.balance}`);
                        return;
                    }

                    order = {
                        "price": parseFloat(self.bid_price),
                        "quantity": 1,
                        "condition": self.$props.condition,
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
        sendMessage(type, msg) {
            msg.gameId = this.$props.game.id;
            msg.type = type;

            console.log(msg);
            this.$props.connection.send(JSON.stringify(msg));
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
        formatUs(num) {
            if (num == null || typeof num != 'number') {
                return num;
            }

            return num.toLocaleString('en-US');
        },
        getSharePrice() {
            if (this.contracts.length === 0) {
                return 0;
            }

            return this.contracts[this.contracts.length - 1].price;
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
