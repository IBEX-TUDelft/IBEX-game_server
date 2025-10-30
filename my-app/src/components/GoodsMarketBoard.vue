<template>
    <b-col>
        <div class="d-flex flex-column h-100">

            <confirm></confirm>
            <acknowledge></acknowledge>

            <b-tooltip target="high-quality-median-valuation-id" triggers="hover" placement="bottomleft">
                {{ resolvePlaceHolder('high-quality-median-valuation') }}
            </b-tooltip>

            <b-tooltip target="low-quality-median-valuation-id" triggers="hover" placement="bottomleft">
                {{ resolvePlaceHolder('low-quality-median-valuation') }}
            </b-tooltip>

            <b-row class="no-gutters justify-content-center">
                <b-col>
                    <b-navbar class="mb-0" id="navbar" toggleable="md" type="dark" variant="info">
                        <b-navbar-nav style="width: 100%; color: white; font-size: 1.2rem;">
                            <Transition name="slide-fade">
                                <div v-if="showIntructions">
                                    {{ "Player " + player.number }}: {{ player.instructions }}
                                </div>
                            </Transition>
                        </b-navbar-nav>
                        <b-navbar-nav class="ml-auto">
                            <b-nav-item active v-if="timer.on === true" style="width: 150px; text-align: center;">Time
                                left: {{ timer.minutes }}:{{ timer.seconds }}</b-nav-item>
                            <b-nav-item active v-if="!game.over" style="width: 100px; text-align: center;">Round: {{
                                game.round }}</b-nav-item>
                            <b-nav-item active v-if="!game.over" style="width: 200px; text-align: center;">Phase: {{
                                game.phaseTag }}</b-nav-item>
                            <b-nav-item active v-if="game.over" style="width: 100px; text-align: center;">Game
                                Over</b-nav-item>
                        </b-navbar-nav>
                    </b-navbar>
                </b-col>
            </b-row>

            <b-row class="no-gutters" v-if="game.phase === 1">
                <b-col class="col-6 p-5" style="text-align: right;">{{ resolvePlaceHolder('high-quality-median-valuation') }}: <b>{{
                    formatUs(player.signals.highQualitySignal) }}</b> <b-icon v-b-tooltip.hover
                        id="high-quality-median-valuation-id" icon="question-circle-fill"
                        variant="primary"></b-icon></b-col>
                <b-col class="col-6 p-5" style="text-align: left;">{{ resolvePlaceHolder('low-quality-median-valuation') }}: <b>{{
                    formatUs(player.signals.lowQualitySignal) }}</b> <b-icon v-b-tooltip.hover
                        id="low-quality-median-valuation-id" icon="question-circle-fill"
                        variant="primary"></b-icon></b-col>
            </b-row>

            <b-row class="no-gutters justify-content-center flex-grow-1" v-if="game.phase === 0">
                <b-col class="d-flex align-items-center justify-content-center flex-column">
                    <b-row>
                        <b-button v-if="player.authority === 0" size="lg" @click="startGame" variant="primary">{{
                            resolvePlaceHolder('admin-start-button') }}</b-button>
                        <div v-else>{{ resolvePlaceHolder('waiting-for-admin-to-start') }}</div>
                    </b-row>
                </b-col>
            </b-row>

            <b-row class="no-gutters justify-content-center flex-grow-1"
                v-if="(game.phase === 2 && player.authority != 0)">
                <b-col class="d-flex align-items-center justify-content-center flex-column p-3">
                    <table style="text-align: center; width: 100%; table-layout: fixed;">
                        <thead>
                            <tr>
                                <th colspan="9">
                                    <h3>Final Results</h3>
                                </th>
                            </tr>
                            <tr>
                                <th></th>
                                <th>High Quality Goods</th>
                                <th>Value per Unit</th>
                                <th>High Quality Total</th>
                                <th>Low Quality Goods</th>
                                <th>Value per Unit</th>
                                <th>Low Quality Total</th>
                                <th>Cash</th>
                                <th>Grand Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr :style="{ backgroundColor: '#f2f2f2', borderBottom: '1px solid #ddd' }">
                                <td>Final Wallet</td>
                                <td>{{player.wallet?.goods?.filter(good => good.quality === 'good').length || 0}}</td>
                                <td>{{ player.signals.highQualitySignal }}</td>
                                <td>{{((player.wallet?.goods?.filter(good => good.quality === 'good').length || 0) *
                                    player.signals.highQualitySignal).toFixed(2)}}</td>
                                <td>{{player.wallet?.goods?.filter(good => good.quality === 'bad').length || 0}}</td>
                                <td>{{ player.signals.lowQualitySignal }}</td>
                                <td>{{(player.wallet?.goods?.filter(good => good.quality === 'bad').length || 0) *
                                    player.signals.lowQualitySignal}}</td>
                                <td>{{ player.wallet?.cash }}</td>
                                <td>{{ getWalletValue() }}</td>
                            </tr>
                            <tr :style="{ backgroundColor: 'transparent', borderBottom: '1px solid #ddd' }">
                                <td>Initial Wallet</td>
                                <td>{{player.initialWallet?.goods?.filter(good => good.quality === 'good').length || 0
                                    }}</td>
                                <td>{{ player.signals.highQualitySignal }}</td>
                                <td>{{(player.initialWallet?.goods?.filter(good => good.quality === 'good').length ||
                                    0) * player.signals.highQualitySignal}}</td>
                                <td>{{player.initialWallet?.goods?.filter(good => good.quality === 'bad').length || 0
                                    }}</td>
                                <td>{{ player.signals.lowQualitySignal }}</td>
                                <td>{{(player.initialWallet?.goods?.filter(good => good.quality === 'bad').length || 0)
                                    * player.signals.lowQualitySignal}}</td>
                                <td>{{ player.initialWallet?.cash }}</td>
                                <td>{{ getInitialWalletValue() }}</td>
                            </tr>
                            <tr :style="{ backgroundColor: '#f2f2f2', borderBottom: '1px solid #ddd' }">
                                <td>Profit</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>{{ formatUs(getProfit()) }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-html="getProfitString()" />
                </b-col>
            </b-row>

            <b-row class="no-gutters justify-content-center flex-grow-1"
                v-if="(game.phase === 1 && !transitioning) || (game.phase === 2 && player.authority === 0)">
                <b-col class="d-flex align-items-center justify-content-center flex-column col-6"
                    v-if="game.over != true">
                    <GoodsDoubleAuctionMarket ref="doubleAuctionMarket" :connection="connection" :game="game"
                        :player="player" />
                </b-col>

                <b-col
                    :class="'d-flex align-items-center justify-content-center flex-column' + (game.over ? ' col-12' : ' col-6')">
                    <div style="width: 100%">
                        <VueApexCharts height="500px" type="line" :options="chartOptions" :series="series" />
                    </div>
                </b-col>
            </b-row>

            <b-row class="no-gutters justify-content-center flex-grow-1"
                v-if="(game.phase === 2 && player.authority === 0)">
                <b-col class="d-flex align-items-center justify-content-center flex-column">
                    <p>{{ resolvePlaceHolder('total-social-profit') }}: <b>{{ getTotalSocialProfit() }}</b></p>
                </b-col>
            </b-row>

            <b-row class="no-gutters justify-content-center flex-grow-1"
                v-if="(game.phase === 2 && player.authority === 0)">
                <b-col v-if="game.over" class="d-flex align-items-center justify-content-center flex-column col-6 p-2">
                    <table style="width: 100%; text-align: center;"
                        v-if="game.statistics != null && game.statistics.buyers != null">
                        <thead>
                            <tr>
                                <th colspan="2">Buyers</th>
                            </tr>
                            <tr>
                                <th>Player</th>
                                <th>Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(buyer, index) in game.statistics.buyers" :key="index"
                                :style="{ backgroundColor: index % 2 === 0 ? '#f2f2f2' : 'transparent', borderBottom: '1px solid #ddd' }">
                                <td>{{ buyer.number }}</td>
                                <td class="text-center">{{ buyer.profit }}</td>
                            </tr>
                        </tbody>
                    </table>
                </b-col>

                <b-col v-if="game.over" class="d-flex align-items-center justify-content-center flex-column col-6 p-2">
                    <table style="width: 100%; text-align: center;"
                        v-if="game.statistics != null && game.statistics.buyers != null">
                        <thead>
                            <tr>
                                <th colspan="2" style="text-align: center;">Sellers</th>
                            </tr>
                            <tr>
                                <th>Player</th>
                                <th>Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(seller, index) in game.statistics.sellers" :key="index"
                                :style="{ backgroundColor: index % 2 === 0 ? '#f2f2f2' : 'transparent', borderBottom: '1px solid #ddd' }">
                                <td>{{ seller.number }}</td>
                                <td class="text-center">{{ seller.profit }}</td>
                            </tr>
                        </tbody>
                    </table>
                </b-col>
            </b-row>

            <b-row class="no-gutters justify-content-center flex-grow-1"
                v-if="game.phase === 1 && player.authority === 0">
                <b-col class="d-flex align-items-center justify-content-center">
                    <b-button v-if="player.authority === 0" size="lg" @click="endGame" variant="danger">{{
                        resolvePlaceHolder('admin-stop-button') }}</b-button>
                </b-col>
            </b-row>
        </div>
    </b-col>
</template>
<script>
import GoodsDoubleAuctionMarket from './goodsMarket/GoodsDoubleAuctionMarket.vue';
import Confirm from './modals/Confirm.vue';
import Acknowledge from './modals/Acknowledge.vue';
import dictionary from '../assets/goods-market.json';
import { getGameStatus } from '../services/GameService'
import EventService from '../services/EventService';
import FormatService from '../services/FormatServiceDoubleAuction';
import VueApexCharts from 'vue-apexcharts'

export default {
    data() {
        return {
            transitioning: false,
            transitionTimeoutId: null,
            showIntructions: true,
            firstConnection: true,
            connection: null,
            dictionary: {},
            modals: {
                errorList: {
                    show: false,
                    description: 'There is a problem',
                    warnings: [],
                    callback: null
                }, confirm: {
                    show: false,
                    title: 'Confirmation Request',
                    description: 'There is a problem',
                    callback: null
                }, acknowledge: {
                    show: false,
                    title: 'Notice',
                    description: 'Look at This',
                    callback: null
                }
            },
            timer: {
                on: false,
                minutes: "00",
                seconds: "00"
            },
            game: {
                over: false,
                round: 0,
                phase: 0,
                phaseTag: "Introduction",
                ruleset: "",
                properties: [],
                boundaries: null,
                publicSignal: null,
                players: [],
                currentPrice: null,
                realValues: {
                    highQuality: null,
                    lowQuality: null
                },
                statistics: {
                    buyers: {
                        count: [0, 0, 0, 0, 0],
                        averagePrivateSignal: 0
                    },
                    sellers: {
                        count: [0, 0, 0, 0, 0],
                        averagePrivateSignal: 0
                    }
                }
            },
            player: {
                instructions: "",
                tag: "",
                number: null,
                recovery: null,
                role: null,
                market: null,
                signals: {
                    highQualitySignal: null,
                    lowQualitySignal: null
                },
            },
            chartOptions: {
                xaxis: {
                    categories: [],
                    type: 'datetime',
                    labels: {
                        datetimeUTC: false, // This will display local time instead of UTC
                    },
                },
                yaxis: {
                    min: 0,
                    max: 100,
                    tickAmount: 10,
                    logarithmic: false
                },
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
                    }
                },
                annotations: {
                    yaxis: [{
                        y: self.player?.signals?.lowQualitySignal || 0,
                        borderColor: "#FF4560",
                        label: {
                            borderColor: "#FF4560",
                            style: {
                                color: "#fff",
                                background: "#FF4560",
                            },
                            text: 'Personal Low Valuation'
                        }
                    }, {
                        y: self.player?.signals?.highQualitySignal || 100,
                        borderColor: "#00E396",
                        label: {
                            borderColor: "#00E396",
                            style: {
                                color: "#fff",
                                background: "#00E396",
                            },
                            text: 'Personal High Valuation'
                        }
                    }]
                }
            },
            series: [{
                name: 'Price',
                data: []
            }],
            inputNumberCount: 0
        };
    },
    components: {
        GoodsDoubleAuctionMarket,
        Confirm,
        Acknowledge,
        VueApexCharts
    },
    name: 'GoodsDoubleAuctionBoard',
    methods: {
        getTotalSocialProfit() {
            return this.game.statistics.buyers.reduce((acc, buyer) => Math.round((acc + buyer.profit) * 100) / 100, 0) +
                this.game.statistics.sellers.reduce((acc, seller) => Math.round((acc + seller.profit) * 100) / 100, 0);
        },
        getToken() {
            return localStorage.getItem("token");
        },
        getGame() {
            return this.game;
        },
        getPlayer() {
            return this.player;
        },
        updateTimer() {
            const self = this;

            const secondsLeft = Math.round((self.timer.end - Date.now()) / 1000);

            const minutes = Math.floor(secondsLeft / 60);
            const seconds = secondsLeft % 60;

            self.timer.minutes = minutes.toString().padStart(2, '0');
            self.timer.seconds = seconds.toString().padStart(2, '0');

            if (minutes <= 0 && seconds <= 0) {
                console.log('The timer has rung');
                return;
            }

            setTimeout(self.updateTimer, 1000);
        },
        getInitialWalletValue() {
            const wallet = this.player.initialWallet;

            if (wallet == null) {
                return 0;
            }

            let value = wallet.cash;

            value += (wallet.goods.filter(g => g.quality === 'good').length * this.player.signals.highQualitySignal)
            value += (wallet.goods.filter(g => g.quality === 'bad').length * this.player.signals.lowQualitySignal);

            return value.toFixed(2);
        },
        getWalletValue() {
            const wallet = this.player.wallet;

            if (wallet == null) {
                return 0;
            }

            let value = wallet.cash;

            value += wallet.goods.filter(g => g.quality === 'good').length * this.player.signals.highQualitySignal;
            value += wallet.goods.filter(g => g.quality === 'bad').length * this.player.signals.lowQualitySignal;

            return value.toFixed(2);
        },
        getProfit() {
            const expected = Math.round((this.getWalletValue() - this.getInitialWalletValue()) * 100) / 100;

            if (this.player.profit == null && expected === 0) {
                return 0;
            }

            if (expected !== this.player.profit) {
                throw new Error(`Profit mismatch for player ${this.player.number}: expected ${expected}, got ${this.player.profit}`);
            }

            return expected.toFixed(2);
        },
        completeCurrentPhase() {
            const self = this;

            self.sendMessage({
                "gameId": self.game.id,
                "type": "complete-current-phase"
            });
        },
        sendMessage(msg) {
            this.connection.send(JSON.stringify(msg));
        },
        getProfitString() {
            if (this.player.wallet == null) {
                return 'n/a';
            }

            let profit = 0;
            let placeHolder = 'reward-message-profit';

            if (this.player.profit != null) {
                profit = Math.abs(this.player.profit);

                if (this.player.profit < 0) {
                    placeHolder = 'reward-message-loss';
                }
            }

            const highQualityGoods = this.player.wallet.goods.filter(good => good.quality === 'good').length || 0;
            const lowQualityGoods = this.player.wallet.goods.filter(good => good.quality === 'bad').length || 0;

            const finalWalletValue = this.game.realValues.highQuality * highQualityGoods + this.game.realValues.lowQuality * lowQualityGoods + this.player.wallet.cash;
            const initialWalletValue = this.game.realValues.highQuality * (this.player.initialWallet?.goods.filter(good => good.quality === 'good').length || 0) + this.game.realValues.lowQuality * (this.player.initialWallet?.goods.filter(good => good.quality === 'bad').length || 0) + this.player.initialWallet?.cash;

            return this.resolvePlaceHolder(placeHolder,
                this.player.signals.highQualitySignal,
                highQualityGoods,
                this.player.signals.highQualitySignal * highQualityGoods,
                this.player.signals.lowQualitySignal,
                lowQualityGoods,
                this.player.signals.lowQualitySignal * lowQualityGoods,
                this.player.wallet.cash,
                finalWalletValue,
                initialWalletValue,
                profit
            );
        },
        resetToPhaseZero() {
            this.player.signals = [];

            this.player.market = null;

            this.phase = 0;
            this.publicSignal = null;
        },
        getRootContext() {
            return this;
        },
        recover(gameData) {
            const self = this;

            console.log(gameData);
            //TODO

            this.resetToPhaseZero();

            for (const prop in gameData.player) {
                self.player[prop] = gameData.player[prop];
            }

            self.chartOptions.annotations.yaxis[0].y = self.player?.signals?.lowQualitySignal || 0;
            self.chartOptions.annotations.yaxis[1].y = self.player?.signals?.highQualitySignal || 100;

            self.chartOptions.annotations.yaxis[0].label.text = this.resolvePlaceHolder('low-quality-median-valuation')
            self.chartOptions.annotations.yaxis[1].label.text = this.resolvePlaceHolder('high-quality-median-valuation')

            if (gameData.game.over != null) {
                self.game.over = gameData.game.over;
            }

            for (const prop in gameData.game) {
                self.game[prop] = gameData.game[prop];
            }

            console.log('GAME')
            console.log(self.game);

            if (self.game.orders != null && self.game.orders.length > 0) {
                if (self.game.orders != null) {
                    self.game.orders.forEach(order => {
                        console.log(order);
                        self.$refs.doubleAuctionMarket.orderEvent(order, "add");
                    });
                }
            }

            if (self.game.movementList != null && self.game.movementList.length > 0) {
                if (self.game.movementList != null) {
                    self.game.movementList.forEach((movement) => {
                        self.$refs.doubleAuctionMarket.orderEvent(movement, "contract");
                    });
                }
            }

            if (self.game.tickers != null && self.game.tickers.length > 0) {
                console.log('Recovering tickers', self.game.tickers);

                self.game.currentPrice = self.game.tickers[self.game.tickers.length - 1].price;

                self.series = [{
                    name: 'Price',
                    data: self.game.tickers.slice(-100).map(t => ({
                        x: t.time,
                        y: t.price
                    }))
                }];
            }

            if (gameData.timer != null) {
                self.timer.end = gameData.timer > Date.now() ? gameData.timer : Date.now();

                self.updateTimer();

                self.timer.on = true;
            }

            window.dispatchEvent(new Event('resize'));
        },
        openWebSocket() {
            const self = this;

            this.connection = new WebSocket(process.env.VUE_APP_WSS);

            this.connection.onmessage = function (event) {
                const ev = JSON.parse(event.data);

                if (ev.type === "event") {
                    //TODO: give structure to this logic
                    console.log(`New event: ${ev.eventType}`);
                    console.log(ev.data);

                    EventService.emit(ev.eventType, ev.data);

                    switch (ev.eventType) {
                        case 'player-joined':
                            console.log(ev.data)
                            for (let key in ev.data) {
                                self.player[key] = ev.data[key];
                            }

                            self.chartOptions.annotations.yaxis[0].y = self.player?.signals?.lowQualitySignal || 0;
                            self.chartOptions.annotations.yaxis[1].y = self.player?.signals?.highQualitySignal || 100;

                            var initialInstructions = self.dictionary.instructions.phases[self.game.phase][
                                ['admin', 'buyer', 'seller'][self.player.authority != null ? self.player.authority : 1]
                            ];

                            self.player.instructions = initialInstructions;

                            break;
                        case 'ready-received':
                            self.player.ready = true;
                            break;
                        case "phase-transition":
                            self.game.round = ev.data.round;
                            self.game.phase = ev.data.phase;

                            self.game.phaseTag = self.dictionary.instructions.phases[self.game.phase]?.tag;

                            var phaseInstructions = self.dictionary.instructions.phases[self.game.phase][
                                ['admin', 'buyer', 'seller'][self.player.authority]
                            ];

                            self.showIntructions = false;

                            setTimeout(() => {
                                self.player.instructions = phaseInstructions;

                                self.showIntructions = true;
                            }, 2000);

                            if ([4, 5].includes(ev.data.phase)) {
                                break;
                            }

                            self.startTransition();

                            if (self.game.phase === 1) {
                                setTimeout(() => {
                                    EventService.emit('clear-contracts');
                                }, 50)
                            }

                            if (ev.data.phase === 0) { //New round
                                self.resetToPhaseZero();
                            }

                            break;
                        case "set-timer":
                            self.timer.end = ev.data.end;

                            self.updateTimer();

                            self.timer.on = true;

                            break;
                        case "reset-timer":
                            self.timer.end = null;

                            self.timer.on = false;

                            break;
                        case 'public-signal': {
                            self.game.publicSignal = ev.data.publicSignal;
                            break;
                        }
                        case 'asset-movement': {
                            self.player.wallet.goods = ev.data.goods;
                            self.player.wallet.cash = ev.data.cash;

                            break;
                        }
                        case 'round-end':
                            self.resetToPhaseZero();
                            break;
                        case 'order-refused':
                            var orderRefusedMessage = ev.data.message;

                            if (ev.data.placeholder != null) {
                                if (ev.data.parameters == null) {
                                    orderRefusedMessage = self.resolvePlaceHolder(ev.data.placeholder);
                                } else {
                                    orderRefusedMessage = self.resolvePlaceHolder(ev.data.placeholder, ...ev.data.parameters);
                                }
                            }

                            self.acknowledge('order-refused', orderRefusedMessage);
                            break;
                        case 'game-over':
                            self.game.over = true;
                            break;
                        case 'final-price':
                            self.player.market = {
                                "price": ev.data.price,
                                "balance": self.player.wallet.balance,
                                "shares": self.player.wallet.shares
                            };

                            break;
                        case 'reward':
                            self.game.reward = ev.data;
                            self.player.paymentToken = ev.data.paymentToken;
                            break;
                        case 'profit-report':
                            self.player.profit = ev.data.profit;
                            self.game.realValues = ev.data.realValues;
                            self.game.currentPrice = ev.data.finalPrice;

                            break;
                        case 'contract-fulfilled':
                            self.game.currentPrice = ev.data.price;

                            self.series = [{
                                data: [...self.series[0].data.slice(-99), {
                                    x: ev.data.time,
                                    y: ev.data.price
                                }]
                            }];

                            break;
                        case 'market-statistics':
                            self.game.statistics = ev.data;
                            break;
                        default:
                            console.error(`Type ${ev.eventType} was not understood`);
                    }
                } else { //it is a message
                    console.log(`${ev.type} - ${ev.message}`);
                }
            }

            this.connection.onopen = function () {
                console.log("Successfully connected to the websocket server...");

                self.sendMessage({
                    "gameId": self.game.id,
                    "type": "join",
                    "recovery": self.player.recovery
                });
            }

            this.connection.onclose = function (code, reason) {
                console.log('Reopening a connection after it was closed', code, reason);
                self.openWebSocket();
            }

            this.connection.onerror = function (e) {
                console.log('Reopening a connection after it was closed by an error', e);
                self.openWebSocket();
            }
        },
        startTransition() {
            if (this.transitionTimeoutId != null) {
                clearTimeout(this.transitionTimeoutId);
            }

            this.transitioning = true;

            setTimeout(() => {
                this.transitioning = false;
            }, 3000);
        },
        resolvePlaceHolder(placeholder, ...parameters) {
            if (this.dictionary == null) {
                console.warn('No dictionary available');
                return placeholder;
            }

            if (this.dictionary.placeHolders == null) {
                console.warn('No placeholders in the dictionary');
                return placeholder;
            }

            if (this.dictionary.placeHolders[placeholder] == null) {
                console.warn(`Placeholder not found in the dictionary: ${placeholder}`);
                return placeholder;
            }

            let line = this.dictionary.placeHolders[placeholder];

            if (parameters != null) {
                parameters.forEach((p, i) => {
                    line = line.replaceAll('${' + i + '}', p);
                })
            }

            return line;
        },
        acknowledge(titlePlaceholder, descriptionPlaceholder) {
            this.modals.acknowledge.title = this.resolvePlaceHolder(titlePlaceholder);
            this.modals.acknowledge.description = this.resolvePlaceHolder(descriptionPlaceholder);
            this.modals.acknowledge.show = true;
        },
        async confirm(titlePlaceholder, descriptionPlaceholder) {
            this.modals.confirm.title = this.resolvePlaceHolder(titlePlaceholder);
            this.modals.confirm.description = this.resolvePlaceHolder(descriptionPlaceholder);
            this.modals.confirm.show = true;

            const result = await new Promise((resolve) => {
                this.modals.confirm.confirm = () => {
                    resolve(true);
                };

                this.modals.confirm.cancel = () => {
                    resolve(false);
                };
            });

            this.modals.confirm.show = false;

            return result;
        }, isAllowed(e) {
            if (![8, 9, 35, 36, 37, 38, 39, 40, 46, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 110, 188, 190].includes(e.which)) {
                console.log(`Sorry ${e.which}`)
                e.preventDefault();
                return false;
            }

            return true;
        }, async onChangeWrapper(e) {
            if (!this.isAllowed(e)) {
                return false;
            }

            this.inputNumberCount++;

            const id = this.inputNumberCount;

            await new Promise((resolve) => setTimeout(resolve, 250));

            if (id != this.inputNumberCount) {
                return;
            }

            try {
                this.onChange(e);
            } catch (err) {
                console.error('While handling an input', err);
            }

            this.inputNumberCount = 0;
        },
        onChange(e) {
            if (e.target.value == null || e.target.value.trim() == '') {
                return;
            }

            if ([35, 36, 37, 39].includes(e.which)) {
                return;
            }

            const valueToCaret = e.target.value.substring(0, e.target.selectionStart);

            if (valueToCaret == null || valueToCaret.trim() == '') {
                e.target.selectionStart = 0;
                e.target.selectionEnd = 0;

                return;
            }

            let key = e.key;

            if ([8, 46].includes(e.which)) {
                key = valueToCaret[valueToCaret.length - 1];

                if (key === '.') {
                    key = valueToCaret[valueToCaret.length - 2];
                }
            }

            const relativePositionOfKey = valueToCaret.split(key).length - 1;

            e.target.value = this.reformat(e.target.value);

            console.log(`e.target.value: ${e.target.value}`);

            let caret = 0;
            let repetitionOfKeys = 0;

            while (repetitionOfKeys < relativePositionOfKey) {
                if (e.target.value.charAt(caret) === key) {
                    repetitionOfKeys++;
                }

                if (caret === e.target.value.length) {
                    break;
                }

                caret++;
            }

            e.target.selectionStart = caret;
            e.target.selectionEnd = caret;
        }, reformat(stringValue) {
            if (stringValue == null || stringValue.trim() === '') {
                return stringValue;
            }

            return this.formatService.reformat(stringValue);
        }, parseFormatted(numericalString, def) {
            console.log(`Parsing ${numericalString} (${typeof numericalString}), `)

            if (numericalString == null) {
                return def;
            }

            const result = this.formatService.parse(numericalString);

            if (Number.isNaN(result)) {
                console.error(`Could not parse ${numericalString} (${typeof numericalString}) into a number according to format ${this.format}`);
                return def;
            }

            return result;
        }, extractDataFromObject(def, object, ...tags) {
            if (object == null) {
                return def;
            }

            if (tags.length === 0) {
                return object;
            }

            let obj = object[tags[0]];

            if (tags.length >= 1) {
                for (let i = 1; i < tags.length; i++) {
                    obj = obj[tags[i]];

                    if (obj == null) {
                        break;
                    }
                }
            }

            if (obj == null) {
                return def;
            }

            return obj;
        }, async startGame() {
            const confirmed = await this.confirm('confirm-start-game', 'confirm-start-game-description');

            if (!confirmed) {
                return;
            }

            this.sendMessage({
                "gameId": this.game.id,
                "type": "start-game"
            });
        }, async endGame() {
            const confirmed = await this.confirm('confirm-end-game', 'confirm-end-game-description');

            if (!confirmed) {
                return;
            }

            this.sendMessage({
                "gameId": this.game.id,
                "type": "end-game"
            });
        }, formatUs(n) {
            return this.formatService.format(n);
        }
    },
    async mounted() {
        const self = this;

        this.game.id = parseInt(this.$route.params.id);
        this.player.recovery = this.$route.params.recovery;
        window.vue = this;

        let attempts = 0;
        let response = null;

        while (attempts < 3) {
            response = await getGameStatus(this.$route.params.id, this.$route.params.recovery);

            if (response != null) {
                break;
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            attempts++;
        }

        console.log('Status: ');
        console.log(response);

        if (response.canJoin != true) {
            console.log('The game is full');
            return;
        }

        self.dictionary = dictionary;

        if (dictionary.parameters.format != null) {
            self.format = dictionary.parameters.format;
        }

        self.formatService = new FormatService(self.format);

        if (response.gameData != null) {
            self.game.phase = response.gameData.game.phase;
            self.game.ruleset = response.gameData.game.ruleset;
            if (response.gameData.game.statistics != null) {
                self.game.statistics = response.gameData.game.statistics;
            }
            self.game.phaseTag = self.dictionary.instructions.phases[self.game.phase]?.tag;

            self.showIntructions = true;

            console.log('AWAITING TO RECOVER THE DATA');

            await new Promise(resolve => setTimeout(resolve, 1)); //allows the refs to load

            self.recover(response.gameData);

            console.log('DATA RECOVERED');

            const phaseInstructions = self.dictionary.instructions.phases[self.game.phase][
                ['admin', 'buyer', 'seller'][self.player.authority]
            ];

            self.player.instructions = phaseInstructions;

            if (self.game.currentPrice == null) {
                self.game.currentPrice = self.game.publicSignal | 0;
            }

            await new Promise(resolve => setTimeout(resolve, 1)); //allows the refs to load

            EventService.on('component-ready', () => {
                EventService.emit('data-recovered', response.gameData);
            });
        }

        try {
            self.openWebSocket();
        } catch (err) {
            console.log(err);
        }
    }
}
</script>
<style>
.slide-fade-enter-active {
    transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
    transition: all 2.0s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    transform: translateX(50px);
    opacity: 0;
}
</style>