<template>
    <div class="d-flex flex-row">
        <div class="d-flex flex-column col-6" v-for="condition in $parent.game.conditions" :key="condition.id" :style="'border: 5px solid ' + (isLeading(condition) ? 'yellow' : 'white') + ';'" >
            <DoubleAuctionMarketSingle
                :ref="'doubleAuctionMarket' + condition.id"
                :condition="condition.id"
                :conditionName="condition.name"
                :connection="$parent.connection"
                :game="$parent.game"
                :player="$parent.player"
                :pushMessage="$parent.pushMessage"
            />
        </div>
    </div>
</template>

<script>
import DoubleAuctionMarketSingle from './DoubleAuctionMarketSingle.vue';
import EventService from '../services/EventService';

export default {
    name: 'DoubleAuctionMarketFutarchy',
    data() {
        return {
            fields: ['name', 'price'],
            activity: [],
            markets: []
        }
    },
    methods: {
        isLeading(condition) {
            if (this.markets == null || this.markets[0] == null) {
                return false;
            }

            return this.markets[0].name === condition.name;
        },
        formatUs(num) {
            return this.$parent.formatUs(num);
        }
    },
    components: {
        DoubleAuctionMarketSingle
    },
    mounted () {
        for (let i = 0; i < this.$parent.game.conditions.length; i++) {
            this.activity[i] = false;

            this.markets[i] = {
                "name": this.$parent.game.conditions[i].name,
                "price": 0
            }
        }

        EventService.on('median-updated', (condition, median) => {
            console.log('median-updated ' + condition + ' ' + median);

            const market = this.markets.find(m => m.name === condition);

            if (market == null) {
                console.log('Could not find ' + condition);
                console.log(this.markets.map(m => m.name));
                return;
            }

            market.price = median;

            this.markets.sort((a, b) => b.price - a.price);

            console.log(this.markets);
        });
    }
}
</script>