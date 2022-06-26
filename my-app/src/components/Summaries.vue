<template>
    <div class="p-2">
        <table class="table table-bordered" style="table-layout: fixed;">
            <col />
            <col />
            <colgroup span="4"></colgroup>
            <colgroup span="2"></colgroup>
            <colgroup span="2"></colgroup>
            <col />
            <thead class="thead-dark text-center">
                <th colspan="2"></th>
                <th colspan="4" scope="colgroup">Tax Payments</th>
                <th colspan="2" scope="colgroup">Repurchase Gains/Losses</th>
                <th colspan="2" scope="colgroup">Financial Market Earnings</th>
                <th></th>
            </thead>
            <thead class="thead-dark">
                <th>Round</th>
                <th>Value</th>
                <th>Declaration (1)</th>
                <th>Tax (1)</th>
                <th>Declaration (2)</th>
                <th>Tax (2)</th>
                <th>Repurchase (1)</th>
                <th>Repurchase (2)</th>
                <th>Trading Cash</th>
                <th>Shares Payoff</th>
                <th>Total Earnings</th>
            </thead>
            <tbody>
                <tr v-for="summary in summaries" :key="summary.round">
                    <td>{{ summary.round }}</td>
                    <td>{{ formatForPrinting(summary.value) }}</td>
                    <td>{{ formatForPrinting(summary.firstDeclaration) }}</td>
                    <td>{{ formatForPrinting(-summary.firstTaxes) }}</td>
                    <td>{{ formatForPrinting(summary.secondDeclaration) }}</td>
                    <td>{{ formatForPrinting(-summary.secondTaxes) }}</td>
                    <td>{{ formatForPrinting(summary.firstRepurchase) }}</td>
                    <td>{{ formatForPrinting(summary.secondRepurchase) }}</td>
                    <td>{{ formatForPrinting(summary.cash) }}</td>
                    <td>{{ formatForPrinting(summary.sharesPayoff) }}</td>
                    <td>{{ getTotalEarnings(summary) }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
<script>
export default {
    props: ['summaries'],
    data() {
        return {}
    },
    methods: {
        formatForPrinting(repurchase) {
            if (repurchase == null) {
                return 'n/a';
            }

            if (repurchase === 0) {
                return 0;
            }

            return this.formatUs(Math.round(repurchase * 100) / 100);
        }, formatUs(num) {
            if (num == null || typeof num != 'number') {
                return num;
            }

            if (num > 0)  {
                return num.toLocaleString('en-US')    
            } else {
                return `(${(-num).toLocaleString('en-US')})`;
            }
        }, getTotalEarnings(summary) {
            const total = this.toNum(summary.value) +
                - this.toNum(summary.firstTaxes)
                - this.toNum(summary.secondTaxes)
                + this.toNum(summary.firstRepurchase)
                + this.toNum(summary.secondRepurchase)
                + this.toNum(summary.cash)
                + this.toNum(summary.sharesPayoff);

            return this.formatUs(total);
        }, toNum(num) {
            if (typeof num === 'number') {
                return num;
            }

            return 0;
        }
    }
}
</script>
