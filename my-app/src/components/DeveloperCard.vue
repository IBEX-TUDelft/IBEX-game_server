<template>
    <div v-if="player != null">
        <b-card 
            v-if="role === 2"
            :header="player.tag + '\'s Compensation Request'"
            header-tag="header"
            class="mb-1"
            :bg-variant="owned ? 'danger' : 'light'"
            :text-variant="owned ? 'white' : 'black'"
        >
            <div class="row" v-for="condition in game.conditions" :key="condition.id">
                <div class="col-6 font-weight-bold">
                    {{ condition.name }}
                </div>
                <div class="col-6">
                    {{ player.property != null && player.property.lastOffer != null && player.property.lastOffer[condition.id] != null ?  player.property.lastOffer[condition.id] : '-' }}
                </div>
            </div>
        </b-card>
        <b-card 
            v-else
            class="mb-1"
            :bg-variant="owned ? 'danger' : 'light'"
            :text-variant="owned ? 'white' : 'black'"
        >
            <div class="row">
                <div class="col-12 text-center">
                    {{ player.tag }}
                </div>
            </div>
        </b-card>
    </div>
</template>
<script>
export default {
    props: ['player', 'game', 'role', 'owned'],
    data() {
        return {}
    }
}
</script>
