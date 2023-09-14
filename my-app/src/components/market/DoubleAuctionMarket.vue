<template>
<div class="container-fluid">
    <div class="row justify-content-center">
        <h3 class="text-center">Double Auction Market</h3>
    </div>

    <div class="d-flex flex-row mt-1 p-0">
        <div class="col-4" >Public Signal: <b>{{ formatUs(game.publicSignal) }}</b> <b-icon v-b-tooltip.hover id="public-signal-id" icon="question-circle-fill" variant="primary"></b-icon></div>
        <div class="col-4" v-if="player.role != 0">Private Signal: <b>{{ player.signal == null ? 'n/a' : formatUs(player.signal) }}</b> <b-icon v-b-tooltip.hover id="private-signal-id" icon="question-circle-fill" variant="primary"></b-icon></div>
        <div class="col-4" v-else>Real Value: <b>{{ player.signal == null ? 'n/a' : formatUs(player.signal) }}</b> <b-icon v-b-tooltip.hover id="real-value-id" icon="question-circle-fill" variant="primary"></b-icon></div>
    </div>

    <b-tooltip target="public-signal-id" triggers="hover" placement="bottomleft">
        {{ resolvePlaceHolder('public-signal-tooltip') }}
    </b-tooltip>

    <b-tooltip target="private-signal-id" triggers="hover" placement="bottomleft" v-if="player.role != 0">
        {{ resolvePlaceHolder('private-signal-tooltip') }}
    </b-tooltip>

    <b-tooltip target="real-value-id" triggers="hover" placement="bottomleft" v-else>
        {{ resolvePlaceHolder('real-value-tooltip') }}
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
                    <div v-if="player.wallet != null && player.wallet != null" class="d-flex flex-row mb-auto mt-2">
                        Shares: {{ player.wallet.shares }}
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

                    <div v-if="player.wallet != null && player.wallet != null" class="d-flex flex-row mt-2">
                        Cash: {{ formatUs(player.wallet.balance) }}
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
                <div>Price: <b>{{ getSharePrice() }}</b> <b-icon v-b-tooltip.hover id="price-tooltip-id" icon="question-circle-fill" variant="primary"></b-icon></div>
            </b-row>

            <b-tooltip target="price-tooltip-id" triggers="hover" placement="bottomleft">
                {{ resolvePlaceHolder('price-tooltip') }}
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
import EventService from '../../services/EventService';

export default {
    props: ['player', 'game', 'connection'],
    data() {
        return {
            asks: [],
            bids: [],
            ask_price: null,
            bid_price: null,
            contracts: []
        }
    },
    name: 'DoubleAuction',
    methods: {
        completeMarketPhase() {
            this.sendMessage("complete-market-phase", {});
        },
        removeBid(id) {
            const bid = this.bids.find(b => b.id === id);

            if (bid == null) {
                console.log(`Bid with id ${id} not found`);
                return;
            }

            this.sendMessage("cancel-order", {
                "order": {
                    "id": bid.id
                }
            });
        },
        removeAsk(id) {
            const ask = this.asks.find(a => a.id === id);

            if (ask == null) {
                console.log(`Ask with id ${id} not found`);
                return;
            }

            this.sendMessage("cancel-order", {
                "order": {
                    "id": ask.id                }
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

            const balance = this.$props.player.wallet.balance;
            const shares = this.$props.player.wallet.shares;

            switch(type) {
                case "ask":
                    if (shares < 1) {
                        return;
                    }

                    order = {
                        "price": now ? 0 : self.parseFormatted(self.ask_price),
                        "quantity": 1,
                        "type": type,
                        "now": now
                    }

                    self.ask_price = null;

                    break;
                case "bid":
                    if (balance < self.bid_price) {
                        return;
                    }

                    order = {
                        "price": now ? 0 : self.parseFormatted(self.bid_price),
                        "quantity": 1,
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
            if (num == null) {
                return 'n/a';
            }

            const rounded = Math.round(num * 100) / 100;

            return this.$parent.formatUs(rounded.toString());
        },
        getSharePrice() {
            if (this.contracts.length === 0) {
                return 0;
            }

            const price = typeof this.contracts[0].price === 'number' ?
                this.contracts[0].price : parseInt(this.contracts[0].price);

            return this.formatUs(price);
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

        EventService.on('add-order', (event) => {
            console.log('Captured add-order');
            console.log(event);

            self.orderEvent(event.order, "add");
        });

        EventService.on('delete-order', (event) => {
            console.log('Captured delete-order');
            console.log(event);

            self.orderEvent(event.order, "delete");
        });

        EventService.on('update-order', (event) => {
            console.log('Captured update-order');
            console.log(event);

            self.orderEvent(event.order, "update");
        });

        EventService.on('contract-fulfilled', (event) => {
            console.log('Captured contract-fulfilled');
            console.log(event);

            self.orderEvent(event, "contract");

            EventService.emit('median-updated', self.getMedianPriceAsInt());
        });

        let dataRecovered = false;

        EventService.on('data-recovered', async (data) => {
            if (dataRecovered === true) {
                return;
            }

            if (data.game.movementList == null) {
                return;
            }
            
            dataRecovered = true;

            data.game.movementList.forEach(contract => {
                self.contracts.push(contract);
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            EventService.emit('median-updated', self.getMedianPriceAsInt());
        });

        EventService.on('clear-contracts', () => {
            self.contracts.length = 0;
        });

        EventService.emit('component-ready');
    }
}
</script>
