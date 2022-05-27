<template>
    <div>
        <b-card no-body>
            <b-tabs card content-class="mt-3">
                <b-tab v-for="condition in $parent.conditions" :key="condition.id" :title="condition.name" active>
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
                <!--b-tab title="Project A">
                    <HarbergerMatrix
                        :condition="1"
                        project="Project A"
                        :game="$parent.game"
                        :player="$parent.player"
                        :checkedPlots="$parent.checkedPlots"
                        :getDeclarationPlayer="$parent.getDeclarationPlayer"
                        :getSniperProbability="$parent.getSniperProbability"
                    />
                </b-tab>
                <b-tab title="Project B">
                    <HarbergerMatrix
                        :condition="2"
                        project="Project B"
                        :game="$parent.game"
                        :player="$parent.player"
                        :checkedPlots="$parent.checkedPlots"
                        :getDeclarationPlayer="$parent.getDeclarationPlayer"
                        :getSniperProbability="$parent.getSniperProbability"
                    />
                </b-tab-->
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
}
</script>