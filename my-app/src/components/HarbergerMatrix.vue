<template>

    <div class="row-12">
        
        <div class="text-center mb-1"><b>Declarations {{ condition != null ? '(' + condition.name + ')' : '' }}</b></div>

        <b-form-checkbox-group
            :id="'checkbox-group-' + (condition != null ? condition.id : 'tbd')"
            v-model="checkedPlots[(condition != null ? condition.id : 'tbd')]"
            :name="'checkedPlots' + (condition != null ? condition.id : 'tbd')"
        >

            <div class="row mb-1" v-for="offset in [0,3]" :key="offset">
                <div class="col-4" v-for="index in [0 + offset, 1 + offset, 2 + offset]" :key="index">
                    <b-card 
                        :header="getDeclarationPlayer(index)"
                        header-tag="header"
                        class="mb-1"
                        :bg-variant="(player.role != 1 && index + 1 === player.number) ? 'danger' : 'light'"
                        :text-variant="(player.role != 1 && index + 1 === player.number) ? 'white' : 'black'"
                    >
                        <div class="row">
                            <div v-if="condition != null" class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                                <div class="container text-center">
                                    <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                        && game.declarations[index] != null && game.declarations[index].available[condition.id]" :value="game.declarations[index].id" />
                                    {{ game.declarations[index] == null || condition == null ? '-' : formatUs(game.declarations[index].d[condition.id]) }} ({{ getSniperProbability(index, condition.id)}}%)
                                </div>
                            </div>
                        </div>
                    </b-card>
                </div>
            </div>

        </b-form-checkbox-group>
    </div>
</template>

<script>
export default {
    props: ['condition', 'project', 'checkedPlots', 'game', 'player', 'getDeclarationPlayer', 'getSniperProbability'],
    methods: {
        formatUs(num) {
            if (num == null || typeof num != 'number') {
                return num;
            }

            return num.toLocaleString('en-US');
        }
    }
}
</script>