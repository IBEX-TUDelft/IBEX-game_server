<template>

    <div class="flex-row">
        
        <div class="text-center mb-1"><b>Declarations</b></div>

        <b-form-checkbox-group
            :id="'checked-plots'"
            v-model="$parent.checkedPlots"
            name="checked-plots"
            class="d-flex flex-column col"
        >
            <div class="row p-0" v-for="offset in [0,3]" :key="offset">
                <div class="col-4 p-1" v-for="index in [0 + offset, 1 + offset, 2 + offset]" :key="index">
                    <b-card 
                        :header="getDeclarationPlayer(index)"
                        header-tag="header"

                        :bg-variant="(player.role != 1 && index + 1 === player.number) ? 'primary' : 'light'"
                        :text-variant="(player.role != 1 && index + 1 === player.number) ? 'white' : 'black'"
                    >
                        <div class="row p-0" v-for="condition in game.conditions" :key="condition.id">
                            <div class="col" v-if="game.winningCondition == null || game.winningCondition === condition.id">
                                <div class="row" v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                        && game.declarations[index] != null && player.hasToSpeculate">
                                    <div class="col-1 p-0">
                                        <b-form-checkbox :value="(index + 1) + '.' + condition.id" />
                                    </div>
                                    <div class="col-4 p-0">
                                        {{ condition.name }}
                                    </div>
                                    <div class="col-7 p-0 text-right">
                                        {{ getGameDeclaration(index, condition) }} ({{ getSniperProbability(index, condition.id)}}%)
                                    </div>
                                </div>
                                <div v-else class="row">
                                    <div class="col-6">
                                        {{ condition.name }}:
                                    </div>
                                    <div class="col-6 text-right">
                                        {{ getGameDeclaration(index, condition) }}
                                    </div>
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
            return this.$parent.formatUs(num);
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