<template>
<div class="container-fluid">
    <div class="row justify-content-center">
        <h3 class="text-center">{{ conditionName }}</h3>
    </div>

    <div class="d-flex flex-row mt-1 p-0">
        <div class="col-4" >Public Signal: <b>{{ formatUs(game.publicSignal[condition]) }}</b> <b-icon v-b-tooltip.hover :id="'public-signal-id' + condition" icon="question-circle-fill" variant="primary"></b-icon></div>
        <div class="col-4" >Private Signal: <b>{{ player.signals == null ? 'n/a' : formatUs(player.signals[condition]) }}</b> <b-icon v-b-tooltip.hover :id="'private-signal-id' + condition" icon="question-circle-fill" variant="primary"></b-icon></div>
        <div class="col-4" v-if="player.role != 1">
            Your Property's Value:  <b>{{ formatUs(player.property.v[condition]) }}</b>
        </div>
    </div>

    <b-tooltip :target="'public-signal-id' + condition" triggers="hover" placement="bottomleft">
        {{ resolvePlaceHolder('public-signal-tooltip', conditionName) }}
    </b-tooltip>

    <b-tooltip :target="'private-signal-id' + condition" triggers="hover" placement="bottomleft">
        {{ resolvePlaceHolder('private-signal-tooltip', conditionName) }}
    </b-tooltip>



    <div class="d-flex flex-row mt-1 p-0">

        <div class="d-flex flex-column col-8">
            <div class="d-flex flex-row p-0">

                <div class="col-6">
                    <div class="row-12">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("ask", false)'>Ask</button>
                    </div>
                </div>

                <div class="col-6">
                    <div class="row-12">
                        <b-form-input @keydown="isAllowed" @keyup="onChange" class="form-control" v-model="ask_price" name="ask_price" id="ask_price" aria-describedby="emailHelp" />
                    </div>
                </div>

            </div>

            <div class="d-flex flex-row mt-1 p-0">
                <div class="d-flex flex-column col-6">
                    <div v-if="player.wallet != null && player.wallet[condition] != null" class="d-flex flex-row mb-auto mt-2">
                        Shares: {{ player.wallet[condition].shares }}
                    </div>

                    <div class="d-flex flex-row">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("bid", true)'>Buy @ -></button>
                    </div>
                </div>

                <div class="d-flex flex-col col-6" style="height: 200px; display: flex; flex-direction: column-reverse; border: 1px solid; overflow: scroll;">
                    <table class="table table-bordered text-center" style="margin-top: auto; margin-bottom: 0px;">
                        <tr v-for="ask in asks" :key="ask.id">
                            <td class="p-1">
                                {{ formatUs(ask.price) }}
                                <b-icon v-if="ask.sender === player.number" @click="removeAsk(ask.id)" icon="x-circle-fill" variant="danger"></b-icon>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="d-flex flex-row mt-1 p-0">

                <div class="d-flex flex-column col-6">
                    <div class="d-flex flex-row">
                        <button type="button" class="btn btn-primary btn-block" @click='postOrder("ask", true)'>Sell @ -></button>
                    </div>

                    <div v-if="player.wallet != null && player.wallet[condition] != null" class="d-flex flex-row mt-2">
                        Cash: {{ formatUs(player.wallet[condition].balance) }}
                    </div>
                </div>

                <div class="d-flex flex-col col-6" style="height: 200px; display: flex; border: 1px solid; overflow: scroll;">
                    <table class="table table-bordered text-center" style="margin-bottom: auto;">
                        <tr v-for="bid in bids" :key="bid.id">
                            <td class="p-1">
                                {{ formatUs(bid.price) }}
                                <b-icon v-if="bid.sender === player.number" @click="removeBid(bid.id)" icon="x-circle-fill" variant="danger"></b-icon>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <div class="d-flex flex-row mt-1 p-0">

                <div class="d-flex flex-column col-6">
                    <button type="button" class="btn btn-primary btn-block" @click='postOrder("bid", false)'>Bid</button>
                </div>

                <div class="d-flex flex-column col-6">
                    <b-form-input @keydown="isAllowed" @keyup="onChange" class="form-control" v-model="bid_price" name="bid_price" id="bid_price" aria-describedby="emailHelp" />
                </div>
            </div>

        </div>

        <div class="d-flex flex-column col-4">
            
            <b-row class="justify-content-center">
                <b>Contracts</b>
            </b-row>

            <b-row class="justify-content-center">
                <div>Median: <b>{{ getMedianPrice() }}</b> <b-icon v-b-tooltip.hover :id="'median-tooltip-id' + condition" icon="question-circle-fill" variant="primary"></b-icon></div>
            </b-row>

            <b-tooltip :target="'median-tooltip-id' + condition" triggers="hover" placement="bottomleft">
                {{ resolvePlaceHolder('median-tooltip', conditionName) }}
            </b-tooltip>

            <b-row style="display: flex; height: 281px; overflow: scroll;">
                <table class="table table-bordered mb-auto" style="table-layout: fixed;">
                    <tbody>
                        <tr style="height: 40px;" v-for="contract in contracts" :key="contract.id">
                            <td class="justify-content-center align-items-center p-0">
                                <div class="text-center" style="font-size: 16px; margin-top: 8px;">{{ formatUs(contract.price) + ((contract.from == player.number) || (contract.to == player.number) ? '*' : '') }}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </b-row>
        </div>
        
    </div>

</div>
</template>

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
        removeBid(id) {
            const self = this;

            const bid = this.bids.find(b => b.id === id);

            if (bid == null) {
                console.log(`Bid with id ${id} not found`);
                return;
            }

            this.sendMessage("cancel-order", {
                "order": {
                    "id": bid.id,
                    "condition": self.$props.condition
                }
            });
        },
        removeAsk(id) {
            const self = this;

            const ask = this.asks.find(a => a.id === id);

            if (ask == null) {
                console.log(`Ask with id ${id} not found`);
                return;
            }

            this.sendMessage("cancel-order", {
                "order": {
                    "id": ask.id,
                    "condition": self.$props.condition
                }
            });
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
                        "price": now ? 0 : self.parseFormatted(self.ask_price),
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
                        "price": now ? 0 : self.parseFormatted(self.bid_price),
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
            if (this.contracts == null || this.contracts.length === 0) {
                console.log(`Current median price: 0`);
                return 0;
            }

            return this.contracts[0].median;
        },
        getMedianPrice() {
            return this.formatUs(this.getMedianPriceAsInt());
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
                case "bid":
                    list = this.bids;
                    break;
                case "contract":
                    order.id = this.contracts.length;

                    this.contracts.unshift(order);

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
        },
        reformat(e) {
            return this.$parent.reformat(e);
        },
        formatInput(e) {
            return this.$parent.formatInput(e);
        },
        isAllowed(e) {
            return this.$parent.isAllowed(e);
        },
        onChange(e) {
            return this.$parent.onChange(e);
        },
        parseFormatted(numericalString, def) {
            return this.$parent.parseFormatted(numericalString, def);
        },
        extractDataFromObject(def, object, ...tags) {
            return this.$parent.extractDataFromObject(def, object, ...tags);
        },
        resolvePlaceHolder(placeHolder, ...parameters) {
            return this.$parent.resolvePlaceHolder(placeHolder, ...parameters);
        },
        getRootContext() {
            return this.$parent.getRootContext();
        }
    },
    async mounted() {
        const self = this;

        self.contracts.length = 0;
        
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

        EventService.on('clear-contracts', () => {
            self.contracts.length = 0;
        });

        EventService.emit('component-ready');
    }
}
</script>
