<template>
    <div class="d-flex flex-row">
        <div class="d-flex flex-column col-6" v-for="condition in $parent.game.conditions" :key="condition.id" :style="'border: 5px solid ' + (condition.id === leading ? 'yellow' : 'white') + ';'" >
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
            markets: [],
            leading: 1
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
        },
        numberOnly(e) {
            return this.$parent.numberOnly(e);
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
    components: {
        DoubleAuctionMarketSingle
    },
    mounted () {
        const self = this;

        for (let i = 0; i < this.$parent.game.conditions.length; i++) {
            this.activity[i] = false;

            this.markets[i] = {
                "name": this.$parent.game.conditions[i].name,
                "condition": this.$parent.game.conditions[i].id,
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

            self.markets.sort((a, b) => b.price - a.price);

            self.leading = self.markets[0].condition;

            console.log(this.markets);
        });
    }
}
</script>