<template>
    <div class="row-12 mb-3">
        <b-card no-body>
            <b-tabs card content-class="mt-3">
                <b-tab
                    v-for="condition in $parent.game.conditions"
                    :key="condition.id"
                    :title="condition.name"
                    :active="condition.id === 0"
                >
                    <HarbergerMatrix
                        :condition="condition"
                        :project="condition.name"
                        :game="$parent.game"
                        :player="$parent.player"
                        :checkedPlots="$parent.checkedPlots"
                        :getDeclarationPlayer="$parent.getDeclarationPlayer"
                        :getSniperProbability="$parent.getSniperProbability"
                        />
                </b-tab>
            </b-tabs>
        </b-card>
    </div>
</template>

<script>
import HarbergerMatrix from './HarbergerMatrix.vue';

export default {
    name: 'FutarchyMatrix',
    components: {
        HarbergerMatrix
    },
    methods: {
        formatUs(num) {
            return this.$parent.formatUs(num);
        }
    }
}
</script>