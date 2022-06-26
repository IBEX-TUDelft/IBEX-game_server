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
                        :bg-variant="(player.role != 1 && index + 1 === player.number) ? 'primary' : 'light'"
                        :text-variant="(player.role != 1 && index + 1 === player.number) ? 'white' : 'black'"
                    >
                        <div class="row">
                            <div class="col-12 text-center" v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                    && game.declarations[index] != null">
                                <b-form-checkbox :value="game.declarations[index].id">
                                {{ getGameDeclaration(index, condition) }} ({{ getSniperProbability(index, condition.id)}}%)
                                </b-form-checkbox>
                            </div>
                            <div v-else class="col-12 text-center">{{ getGameDeclaration(index, condition) }}</div>
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
        },
        getGameDeclaration(index, condition) {
            const declarations = this.$props.game.declarations;

            if (index == null) {
                console.warn('getGameDeclaration: parameter index is null');
                return '-';
            }

            if (condition == null) {
                console.warn('getGameDeclaration: parameter condition is null');
                return '-';
            }

            if (
                declarations == null ||
                declarations[index] == null ||
                declarations[index].d == null ||
                declarations[index].d[condition.id] == null
            ) {
                return '-';
            }

            return this.formatUs(declarations[index].d[condition.id])
        }
    }
}
</script>