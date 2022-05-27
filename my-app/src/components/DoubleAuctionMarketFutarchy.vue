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
                <div v-if="$parent.game.conditions.length > 2" class="col-4">
                    Third Market: {{ thirdMarket.name }} ({{ thirdMarket.price }})
                </div>
            </div>
        </b-card>
        <b-card no-body>
            <b-tabs card content-class="mt-3" v-model="tabIndex">
                <b-tab
                    v-for="condition in $parent.game.conditions"
                    :key="condition.id"
                    :active="condition.id === 0"
                    :ref="'tab-condition-' + condition.id"
                    v-on:click="resetTitle(condition.id)"
                >
                    <template #title>
                        {{ condition.name }} {{ activity[condition.id] ? '*' : '' }}
                    </template>
                    <DoubleAuctionMarketChicago
                        :ref="'doubleAuctionMarket' + condition.id"
                        :condition="condition.id"
                        :conditionName="condition.name"
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
            activity: [],
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

            this.activity[reference] = true;

            this.$forceUpdate();
        },
        contractCompleted(contract) {
            this.markets[contract.condition].price = contract.price;

            this.markets.sort((m1, m2) => m2.price - m1.price);

            this.leadingMarket.name = this.markets[0].name;
            this.leadingMarket.price = this.markets[0].price;

            this.secondMarket.name = this.markets[1].name;
            this.secondMarket.price = this.markets[1].price;

            if (this.$parent.game.conditions.length > 2) {
                this.thirdMarket.name = this.markets[2].name;
                this.thirdMarket.price = this.markets[2].price;
            }
        },
        resetTitle(reference) {
            this.activity[reference] = false;

            this.$forceUpdate();
        }
    },
    components: {
        DoubleAuctionMarketChicago
    },
    mounted () {
        for (let i = 0; i < this.$parent.game.conditions.length; i++) {
            this.activity[i] = false;

            this.markets[i] = {
                "name": this.$parent.game.conditions[i].name,
                "price": 0
            }
        }

        this.leadingMarket.name = this.markets[0].name;
        this.leadingMarket.price = this.markets[0].price;

        this.secondMarket.name = this.markets[1].name;
        this.secondMarket.price = this.markets[1].price;

        if (this.$parent.game.conditions.length > 2) {
            this.thirdMarket.name = this.markets[2].name;
            this.thirdMarket.price = this.markets[2].price;
        }
    }
}
</script>