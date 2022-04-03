<template>
    <div class="row-12">
        <div class="text-center"><b>Declarations ({{ project }})</b></div>

        <b-form-checkbox-group
            :id="'checkbox-group-' + condition"
            v-model="checkedPlots[condition]"
            :name="'checkedPlots' + condition"
        >

        <table class="table table-bordered" style="table-layout: fixed;">
            <tbody>
                <tr>
                    <td :style="player.tag === 'Owner 1' ? 'border: 2px yellow solid;' : ''">
                        <div>{{ getDeclarationPlayer(0) }}</div>
                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                            <div class="container text-center">
                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                    && game.declarations[0] != null && game.declarations[0].available[condition]" :value="game.declarations[0].id" />
                                {{ game.declarations[0] == null ? '-' : formatUs(game.declarations[0].d[condition]) }} ({{ getSniperProbability(0, condition)}}%)
                            </div>
                        </div>
                    </td>
                    <td :style="player.tag === 'Developer' ? 'border: 2px red solid;' : ''">
                        <div>{{ getDeclarationPlayer(1) }}</div>
                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                            <div class="container text-center">
                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                    && game.declarations[1] != null && game.declarations[1].available[condition]" :value="game.declarations[1].id" />
                                {{ game.declarations[1] == null ? '-' : formatUs(game.declarations[1].d[condition]) }} ({{ getSniperProbability(1, condition)}}%)
                            </div>
                        </div>
                    </td>
                    <td :style="player.tag === 'Owner 2' ? 'border: 2px yellow solid;' : ''">
                        <div>{{ getDeclarationPlayer(2) }}</div>
                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                            <div class="container text-center">
                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                    && game.declarations[2] != null && game.declarations[2].available[condition]" :value="game.declarations[2].id" />
                                {{ game.declarations[2] == null ? '-' : formatUs(game.declarations[2].d[condition]) }} ({{ getSniperProbability(2, condition)}}%)
                            </div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td :style="player.tag === 'Owner 3' ? 'border: 2px yellow solid;' : ''">
                        <div>{{ getDeclarationPlayer(3) }}</div>
                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                            <div class="container text-center">
                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                    && game.declarations[3] != null && game.declarations[3].available[condition]" :value="game.declarations[3].id" />
                                {{ game.declarations[3] == null ? '-' : formatUs(game.declarations[3].d[condition]) }} ({{ getSniperProbability(3, condition)}}%)
                            </div>
                        </div>
                    </td>
                    <td :style="player.tag === 'Owner 4' ? 'border: 2px yellow solid;' : ''">
                        <div>{{ getDeclarationPlayer(4) }}</div>
                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                            <div class="container text-center">
                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                    && game.declarations[4] != null && game.declarations[4].available[condition]" :value="game.declarations[4].id" />
                                {{ game.declarations[4] == null ? '-' : formatUs(game.declarations[4].d[condition]) }} ({{ getSniperProbability(4, condition)}}%)
                            </div>
                        </div>
                    </td>
                    <td :style="player.tag === 'Owner 5' ? 'border: 2px yellow solid;' : ''">
                        <div>{{ getDeclarationPlayer(5) }}</div>
                        <div class="min-vh-50 d-flex align-items-center" style="min-height: 50px;">
                            <div class="container text-center">
                                <b-form-checkbox v-if="player.role === 1 && (game.phase === 3 || game.phase === 8)
                                    && game.declarations[5] != null && game.declarations[5].available[condition]" :value="game.declarations[5].id" />
                                {{ game.declarations[5] == null ? '-' : formatUs(game.declarations[5].d[condition]) }} ({{ getSniperProbability(5, condition)}}%)
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

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