<template>
    <div class="row">
        <div class="col">
            <div class="container justify-content-center">
                <p style="text-align:center;"><button type="button" @click='postOrder("bid")' class="btn btn-primary">Buy (Asks)</button></p>
                <div class="row">
                    <div class="form-group col-md-2">
                        <label htmlFor="exampleInputEmail1">Quantity</label>
                    </div>
                    <div class="form-group col-md-2">
                        <input type="number" class="form-control" v-model="bid_quantity" name="bid_quantity" id="bid_quantity" aria-describedby="emailHelp" placeholder="10" />
                    </div>
                    <div class="form-group col-md-2">
                        <label htmlFor="exampleInputEmail1">Price</label>
                    </div>
                    <div class="form-group col-md-2">
                        <input type="number" class="form-control" v-model="bid_price" name="bid_price" id="bid_price" aria-describedby="emailHelp" placeholder="10" />
                    </div>
                    <div class="form-group col-md-2">
                        <label htmlFor="exampleInputEmail1">Now</label>
                    </div>
                    <div class="form-group col-md-2">
                        <input type="checkbox" class="form-control" v-model="bid_now" name="bid_now" id="bid_now" true-value="yes" false-value="no" aria-describedby="emailHelp" placeholder="10" />
                    </div>
                </div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <tr>
                            <th scope="col">Price</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">Controls</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ask in asks" :key="ask.id">
                            <td>{{ formatNumber(ask.price) }}</td>
                            <td>{{ formatNumber(ask.quantity) }}</td>
                            <td>
                                <button v-if="ask.sender == $parent.player.number" type="button" @click='removeOrder(ask.id)' class="btn btn-danger">Remove</button>
                                <button v-if="ask.sender != $parent.player.number" type="button" @click='fillOrder(ask.id, "ask")' class="btn btn-primary">Buy</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div class="col">
            <div class="container justify-content-center">
                <p style="text-align:center;"><button type="button" @click='postOrder("ask")' class="btn btn-primary">Sell (Bids)</button></p>
                <div class="row">
                    <div class="form-group col-md-2">
                        <label htmlFor="exampleInputEmail1">Quantity</label>
                    </div>
                    <div class="form-group col-md-2">
                        <input type="number" class="form-control" v-model="ask_quantity" name="ask_quantity" id="ask_quantity" aria-describedby="emailHelp" placeholder="10" />
                    </div>
                    <div class="form-group col-md-2">
                        <label htmlFor="exampleInputEmail1">Price</label>
                    </div>
                    <div class="form-group col-md-2">
                        <input type="number" class="form-control" v-model="ask_price" name="ask_price" id="ask_price" aria-describedby="emailHelp" placeholder="10" />
                    </div>
                    <div class="form-group col-md-2">
                        <label htmlFor="exampleInputEmail1">Now</label>
                    </div>
                    <div class="form-group col-md-2">
                        <input type="checkbox" class="form-control" v-model="ask_now" name="ask_now" id="ask_now" true-value="yes" false-value="no" aria-describedby="emailHelp" placeholder="10" />
                    </div>
                </div>
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <tr>
                            <th scope="col">Price</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">Controls</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="bid in bids" :key="bid.id">
                            <td>{{ formatNumber(bid.price) }}</td>
                            <td>{{ formatNumber(bid.quantity) }}</td>
                            <td>
                                <button v-if="bid.sender == $parent.player.number" type="button" @click='removeOrder(bid.id)' class="btn btn-danger">Remove</button>
                                <button v-if="bid.sender != $parent.player.number" type="button" @click='fillOrder(bid.id, "bid")' class="btn btn-primary">Sell</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>

const nowMap = {
    "yes": true,
    "no": false
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
            bid_now: "no"
        }
    },
    name: 'DoubleAuctionMarket',
    methods: {
        removeOrder(id) {
            this.sendMessage("cancel-order", {
                "order": {
                    "id": id
                }
            });
        },
        fillOrder(id, type) {
            //let list;

            console.log(id);
            console.log(type);

            /*switch(type) {
                case "ask":
                    list = this.asks;
                    break;
                case "bid":
                    list = this.bids;
                    break;
                default:
                    throw new Error(`Type was ${order.type}. Can be only ask|bid`);
            }
const existing = list.find(o => o.id == order.id);*/

        },
        postOrder(type) {
            const self = this;
            const player = self.$parent.player;
            let order;

            switch(type) {
                case "ask":
                    if (player.shares < self.ask_quantity) {
                        self.pushMessage("warning", `You need ${self.ask_quantity} shares to do this, you only have ${player.shares}`);
                        return;
                    }

                    order = {
                        "price": parseFloat(self.ask_price),
                        "quantity": parseInt(self.ask_quantity),
                        "type": type,
                        "now": nowMap[self.ask_now]
                    }

                    break;
                case "bid":
                    if (player.balance < self.bid_quantity * self.bid_price) {
                        self.pushMessage("warning", `You need ${self.bid_quantity * self.bid_price} coins to buy ${self.bid_quantity} shares
                        at ${self.ask_price} per share, you only have ${player.balance}`);
                        return;
                    }

                    order = {
                        "price": parseFloat(self.bid_price),
                        "quantity": parseInt(self.bid_quantity),
                        "type": type,
                        "now": nowMap[self.bid_now]
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
        orderEvent(order, eventType) {
            let list;

            console.log(eventType);
            console.log(order);

            switch(order.type) {
                case "ask":
                    list = this.asks;
                    break;
                case "bid":
                    list = this.bids;
                    break;
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
                    list.sort((a, b) => a.price - b.price);
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
