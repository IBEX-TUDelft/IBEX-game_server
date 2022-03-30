<template>
    <div>
        <b-tabs content-class="mt-3">
            <b-tab title="No Project" active>
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
            <b-tab title="Project A">
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
            <b-tab title="Project B">
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
    </div>
</template>

<script>
import DoubleAuctionMarketChicago from './DoubleAuctionMarketChicago.vue';

export default {
    name: 'DoubleAuctionMarketFutarchy',
    components: {
        DoubleAuctionMarketChicago
    },
}
</script>