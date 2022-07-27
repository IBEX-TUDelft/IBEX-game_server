<template><div class="container-fluid">
    <div class="row justify-content-center">
        <h3 class="text-center">{{ conditionName }}</h3>
    </div>

    <div class="d-flex flex-row mt-1 p-0">
        <div class="col-4">Median Price: {{ getMedianPrice() }}</div>
        <div class="col-4">Public Signal: {{ formatUs(game.publicSignal[condition]) }}</div>
        <div class="col-4">Private Signal: {{ player.signals == null ? 'n/a' : formatUs(player.signals[condition]) }}</div>
    </div>

    <div class="d-flex flex-row mt-1 p-0">

        <div class="d-flex flex-column col-10 p-0">
            <div class="d-flex flex-row p-0">

                <div class="col-4">
                    <div class="row-12">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("ask", false)'>Ask</button>
                    </div>
                </div>

                <div class="col-4">
                    <div class="row-12">
                        <b-form-input @keydown="$parent.numberOnly" type="number" class="form-control" v-model="ask_price" name="ask_price" id="ask_price" aria-describedby="emailHelp" />
                    </div>
                </div>

            </div>

            <div class="d-flex flex-row mt-1 p-0">
                <div class="d-flex flex-column col-4">
                    <div v-if="player.wallet != null && player.wallet[condition] != null" class="d-flex flex-row mb-auto mt-2">
                        Shares: {{ player.wallet[condition].shares }}
                    </div>

                    <div class="d-flex flex-row">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("bid", true)'>Buy @ -></button>
                    </div>
                </div>

                <div class="d-flex flex-col col-4" style="height: 200px; display: flex; flex-direction: column-reverse; border: 1px solid; overflow: scroll;">
                    <table class="table table-bordered text-center" style="margin-top: auto; margin-bottom: 0px;">
                        <tr v-for="ask in asks" :key="ask.id">
                            <td class="p-1">{{ formatUs(ask.price) }}{{ask.sender == player.number ? '*' : ''}}</td>
                        </tr>
                    </table>
                </div>

                <div class="d-flex flex-column col-4">
                    <div class="d-flex flex-row mb-auto">
                    </div>
                    <div class="d-flex flex-row">
                        <button type="button" class="btn btn-primary btn-block" @click='removeLastAsk()'>Remove Ask</button>
                    </div>
                </div>
            </div>

            <div class="d-flex flex-row mt-1 p-0">

                <div class="d-flex flex-column col-4">
                    <div class="d-flex flex-row">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("ask", true)'>Sell @ -></button>
                    </div>

                    <div v-if="player.wallet != null && player.wallet[condition] != null" class="d-flex flex-row mt-2">
                        Cash: {{ player.wallet[condition].balance }}
                    </div>
                </div>

                <div class="d-flex flex-col col-4" style="height: 200px; display: flex; flex-direction: column-reverse; border: 1px solid; overflow: scroll;">
                    <table class="table table-bordered text-center">
                        <tr v-for="bid in bids" :key="bid.id">
                            <td>{{ formatUs(bid.price) }}{{bid.sender == player.number ? '*' : ''}}</td>
                        </tr>
                    </table>
                </div>

                <div class="d-flex flex-column col-4">
                    <button type="button" class="btn btn-primary btn-block" @click='removeLastBid()'>Remove Bid</button>
                </div>

            </div>

            <div class="d-flex flex-row mt-1 p-0">

                <div class="d-flex flex-column col-4">
                    <button type="button" class="btn btn-primary btn-block" @click='postOrder("bid", false)'>Bid</button>
                </div>

                <div class="d-flex flex-column col-4">
                    <b-form-input @keydown="$parent.numberOnly" type="number" class="form-control" v-model="bid_price" name="bid_price" id="bid_price" aria-describedby="emailHelp" />
                </div>
            </div>

        </div>

        <div class="d-flex flex-column col-2 p-0">
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

</div></template>

<script>
import EventService from '../services/EventService';

export default {
    props: ['condition', 'conditionName', 'player', 'game', 'pushMessage', 'connection'],
    data() {
        return {
            asks: [],
            bids: [],
            ask_price: null,
            bid_price: null,
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

                    self.ask_price = null;

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

                    self.bid_price = null;

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
        getMedianPriceAsInt() {
            if (this.contracts.length === 0) {
                return 0;
            }
            
            let sum = 0;

            for (let i = 0; i < this.contracts.length; i++) {
                sum += this.contracts[i].price;
            }

            return Math.round(sum * 100 / this.contracts.length) / 100;
        },
        getMedianPrice() {
            if (this.contracts.length === 0) {
                return '-';
            }

            let sum = 0;

            for (let i = 0; i < this.contracts.length; i++) {
                sum += this.contracts[i].price;
            }

            return this.formatUs(Math.round(sum * 100 / this.contracts.length) / 100);
        },
        formatUs(num) {
            return this.$parent.formatUs(num);
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
                case "bid":/*if (self.$props.condition === event.update.condition) {
                this.orderEvent(event.order, "contract");
            }*/
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
    },
    async mounted() {
        const self = this;

        console.log('COMPONENT READY ' + this.condition);

        EventService.on('add-order', (event) => {
            console.log('Captured add-order');
            console.log(event);

            if (self.$props.condition === event.order.condition) {
                self.orderEvent(event.order, "add");
            }
        });

        EventService.on('delete-order', (event) => {
            console.log('Captured delete-order');
            console.log(event);

            if (self.$props.condition === event.order.condition) {
                self.orderEvent(event.order, "delete");
            }
        });

        EventService.on('update-order', (event) => {
            console.log('Captured update-order');
            console.log(event);

            if (self.$props.condition === event.update.condition) {
                self.orderEvent(event.order, "update");
            }
        });

        EventService.on('contract-fulfilled', (event) => {
            console.log('Captured contract-fulfilled');
            console.log(event);

            if (self.$props.condition === event.condition) {
                self.orderEvent(event, "contract");
            }

            EventService.emit('median-updated', self.$props.conditionName, self.getMedianPriceAsInt());
        });

        let dataRecovered = false;

        EventService.on('data-recovered', async (data) => {
            if (self.$props.condition == null || dataRecovered === true) {
                return;
            }

            if (data.game.movementList == null) {
                return;
            }
            
            dataRecovered = true;

            console.log(`Captured data-recovered on market ${self.$props.condition}`);

            data.game.movementList[self.$props.condition].forEach(contract => {
                self.contracts.push(contract);
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            EventService.emit('median-updated', self.$props.conditionName, self.getMedianPriceAsInt());
        });

        console.log('COMPONENT ' + this.condition + ' READY TO CAPTURE ' + 'data-recovered');

        EventService.emit('component-ready');
    }
}
</script>
