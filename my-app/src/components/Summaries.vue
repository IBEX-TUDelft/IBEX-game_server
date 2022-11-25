<template>
    <div class="row-12 p-0">
        <b-col class="p-1">
            <div class="row-12">
                <div class="col-12 text-center"><b>Results (Current round in yellow)</b></div>
            </div>

            <div class="row-12">
                <table class="table table-bordered" style="table-layout: fixed;">
                    <col />
                    <col v-if="$parent.player.role != 1" />
                    <colgroup v-if="$parent.player.role != 1" span="4"></colgroup>
                    <colgroup span="2"></colgroup>
                    <colgroup span="2"></colgroup>
                    <col />
                    <thead class="thead-dark text-center">
                        <th v-if="$parent.player.role != 1" colspan="2"></th>
                        <th v-else></th>
                        <th v-if="$parent.player.role != 1" colspan="4" scope="colgroup">Tax Payments</th>
                        <th colspan="2" scope="colgroup">Repurchase Gains/Losses</th>
                        <th colspan="2" scope="colgroup">Financial Market Earnings</th>
                        <th></th>
                    </thead>
                    <thead class="thead-dark">
                        <th>Round</th>
                        <th v-if="$parent.player.role != 1" >Value</th>
                        <th v-if="$parent.player.role != 1">Declaration (1)</th>
                        <th v-if="$parent.player.role != 1">Tax (1)</th>
                        <th v-if="$parent.player.role != 1">Declaration (2)</th>
                        <th v-if="$parent.player.role != 1">Tax (2)</th>
                        <th>Repurchase (1)</th>
                        <th>Repurchase (2)</th>
                        <th>Trading Cash</th>
                        <th>Shares Payoff</th>
                        <th>Total Earnings</th>
                    </thead>
                    <tbody>
                        <tr v-for="summary in summaries" :key="summary.round" :style="summary.round === $parent.game.round && !$parent.game.over ? 'background-color: yellow;' : ''">
                            <td>{{ summary.round === 0 ? 'practice' : summary.round }}</td>
                            <td class="text-right" v-if="$parent.player.role != 1" >{{ formatForPrinting(summary.value) }}</td>
                            <td class="text-right" v-if="$parent.player.role != 1">{{ formatForPrinting(summary.firstDeclaration) }}</td>
                            <td class="text-right" v-if="$parent.player.role != 1">{{ formatForPrinting(summary.firstTaxes, true) }}</td>
                            <td class="text-right" v-if="$parent.player.role != 1">{{ formatForPrinting(summary.secondDeclaration) }}</td>
                            <td class="text-right" v-if="$parent.player.role != 1">{{ formatForPrinting(summary.secondTaxes, true) }}</td>
                            <td class="text-right">{{ formatForPrinting(summary.firstRepurchase) }}</td>
                            <td class="text-right">{{ formatForPrinting(summary.secondRepurchase) }}</td>
                            <td class="text-right">{{ formatForPrinting(getCash(summary)) }}</td>
                            <td class="text-right">{{ formatForPrinting(getSharesPayoff(summary)) }}</td>
                            <td class="text-right">{{ getTotalEarnings(summary) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </b-col>
    </div>
</template>
<script>
export default {
    props: ['summaries'],
    data() {
        return {}
    },
    methods: {
        formatForPrinting(aNumber, negate) {
            if (aNumber == null) {
                return 'n/a';
            }

            if (aNumber === 0) {
                return 0;
            }

            if (negate) {
                aNumber = -aNumber;
            }

            return this.formatUs(Math.round(aNumber * 100) / 100);
        }, formatUs(num) {
            if (num == null || typeof num != 'number') {
                return num;
            }

            return this.$parent.formatUs(num);
        }, getTotalEarnings(summary) {
            let total = this.toNum(summary.value) +
                - this.toNum(summary.firstTaxes)
                - this.toNum(summary.secondTaxes)
                + this.toNum(summary.firstRepurchase)
                + this.toNum(summary.secondRepurchase)
                + this.toNum(this.getCash(summary))
                + this.toNum(this.getSharesPayoff(summary));

            console.log(total);

            if (total === 0) {
                total = 0;
            }

            return this.formatUs(total);
        }, toNum(num) {
            if (typeof num === 'number') {
                return num;
            }

            return 0;
        }, getCash(summary) {
            return summary.market == null ? null : summary.market.balance;
        }, getSharesPayoff(summary) {
            if (
                summary.market == null ||
                summary.market.shares == null ||
                summary.market.price == null
            ) {
                return null;
            }

            return summary.market.shares * summary.market.price;
        }
    }
}
</script>
