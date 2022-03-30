<template>
    <div>
        <b-tabs content-class="mt-3">
            <b-tab title="No Project" active>
                <HarbergerMatrix
                    :condition="0"
                    project="No Project"
                    :game="$parent.game"
                    :player="$parent.player"
                    :checkedPlots="$parent.checkedPlots"
                    :getDeclarationPlayer="$parent.getDeclarationPlayer"
                    :getSniperProbability="$parent.getSniperProbability"
                    />
            </b-tab>
            <b-tab title="Project A">
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
            </b-tab>
        </b-tabs>
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