<template>
    <div>
        <b-card class="mb-1">
            <div class="row">
                <div class="col-4">
                    Leading Market: {{ leadingMarket.name }} ({{ leadingMarket.price }})
                </div>
                <div class="col-4">
                    Second Market: {{ secondMarket.name }} ({{ secondMarket.price }})
                </div>
                <div class="col-4">
                    Third Market: {{ thirdMarket.name }} ({{ thirdMarket.price }})
                </div>
            </div>
        </b-card>
        <b-card no-body>
            <b-tabs card content-class="mt-3" v-model="tabIndex">
                <b-tab active ref="tab-condition-0" v-on:click="resetTitle(0)" >
                    <template #title>
                        No Project {{ activityOn0 ? '*' : '' }}
                    </template>
                    <DoubleAuctionMarketChicago ref="doubleAuctionMarket0"
                        :condition="0"
                        conditionName="No Project"
                        :connection="$parent.connection"
                        :game="$parent.game"
                        :player="$parent.player"
                        :pushMessage="$parent.pushMessage"
                        :formatNumber="$parent.formatNumber"
                    />
                </b-tab>
                <b-tab ref="tab-condition-1" v-on:click="resetTitle(1)">
                    <template #title>
                        Project A {{ activityOn1 ? '*' : '' }}
                    </template>
                    <DoubleAuctionMarketChicago ref="doubleAuctionMarket1"
                        :condition="1"
                        conditionName="Project A"
                        :connection="$parent.connection"
                        :game="$parent.game"
                        :player="$parent.player"
                        :pushMessage="$parent.pushMessage"
                        :formatNumber="$parent.formatNumber"
                    />
                </b-tab>
                <b-tab ref="tab-condition-2" v-on:click="resetTitle(2)">
                    <template #title>
                        Project B {{ activityOn2 ? '*' : '' }}
                    </template>
                    <DoubleAuctionMarketChicago ref="doubleAuctionMarket2"
                        :condition="2"
                        conditionName="Project B"
                        :connection="$parent.connection"
                        :game="$parent.game"
                        :player="$parent.player"
                        :pushMessage="$parent.pushMessage"
                        :formatNumber="$parent.formatNumber"
                    />
                </b-tab>
            </b-tabs>
        </b-card>
    </div>
</template>

<script>
import DoubleAuctionMarketChicago from './DoubleAuctionMarketChicago.vue';

export default {
    name: 'DoubleAuctionMarketFutarchy',
    data() {
        return {
            fields: ['name', 'price'],
            tabIndex: 0,
            activityOn0: false,
            activityOn1: false,
            activityOn2: false,
            leadingMarket: { name: '', price: 0 },
            secondMarket: { name: '', price: 0 },
            thirdMarket: { name: '', price: 0 },
            markets: [ {
                "name": "No Project",
                "price": 0
            }, {
                "name": "Project A",
                "price": 0
            }, {
                "name": "Project B",
                "price": 0
            }]
        }
    },
    methods: {
        activityDetected(reference) {
            if (this.tabIndex === reference) {
                console.log(`Tab ${reference} already active`);
                return;
            }

            this[`activityOn${reference}`] = true;
        },
        contractCompleted(contract) {
            this.markets[contract.condition].price = contract.price;

            this.markets.sort((m1, m2) => m2.price - m1.price);

            this.leadingMarket.name = this.markets[0].name;
            this.leadingMarket.price = this.markets[0].price;

            this.secondMarket.name = this.markets[1].name;
            this.secondMarket.price = this.markets[1].price;

            this.thirdMarket.name = this.markets[2].name;
            this.thirdMarket.price = this.markets[2].price;
        },
        resetTitle(reference) {
            this[`activityOn${reference}`] = false;
        }
    },
    components: {
        DoubleAuctionMarketChicago
    },
    mounted () {
        this.leadingMarket.name = this.markets[0].name;
        this.leadingMarket.price = this.markets[0].price;

        this.secondMarket.name = this.markets[1].name;
        this.secondMarket.price = this.markets[1].price;

        this.thirdMarket.name = this.markets[2].name;
        this.thirdMarket.price = this.markets[2].price;
    }
}
</script>