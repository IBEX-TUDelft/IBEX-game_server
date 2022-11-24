<template>

    <div class="flex-row">
        
        <div class="text-center mb-1"><b>{{ resolvePlaceHolder('property-matrix-header') }}</b></div>

        <b-form-checkbox-group
            :id="'checked-plots'"
            v-model="$parent.checkedPlots"
            name="checked-plots"
            class="d-flex flex-column col"
        >
            <div class="row p-0" v-for="offset in [0,3]" :key="offset">
                <div class="col-4 p-1" v-for="index in [0 + offset, 1 + offset, 2 + offset]" :key="index">
                    <b-card 
                        :header="getHeader(index)"
                        header-tag="header"

                        :bg-variant="(player!= null && player.role != 1 && index + 1 === player.number) ? 'primary' : 'light'"
                        :text-variant="(player!= null && player.role != 1 && index + 1 === player.number) ? 'white' : 'black'"
                    >
                        <div class="row p-0" v-for="condition in game.conditions" :key="condition.id">
                            <div class="col" v-if="game.winningCondition == null || game.winningCondition === condition.id">
                                <div class="row" v-if="player!= null && player.role === 1 && (game.phase === 3 || game.phase === 8)
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
                console.log(`Declaration ${index} of condition ${condition != null ? condition.id : '?'} is empty`);
                return '-';
            }

            return this.formatUs(declarations[index].d[condition.id])
        },
        getHeader(index) {
            return `${this.$props.getDeclarationPlayer(index)}${this.getSnipeFormatted(index)}`;
        },
        getSnipeFormatted(index) {
            if (this.$props.player.role != 1) {
                return '';
            }

            let tag = '';

            switch(index) {
                case 0:
                    tag = 'Owner 1';
                    break;
                case 1:
                    tag = 'Developer';
                    break;
                default:
                    tag = `Owner ${index}`;
            }

            const player = this.$parent.game.players.find(p => p.tag === tag);

            if (player == null) {
                console.log(`Player ${index + 1} not found.`);
                return '';
            }

            if (player.role === 1) {
                return '';
            }

            if (player.snipe == null) {
                return '';
            }
            
            return ` (${this.$parent.resolvePlaceHolder('last-speculation')}: ${this.formatUs(player.snipe)})`;
        },
        resolvePlaceHolder(placeHolder) {
            return this.$parent.resolvePlaceHolder(placeHolder);
        }
    }
}
</script>