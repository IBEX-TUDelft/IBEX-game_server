<template>
    <div @click="setIsActive()" :class="isActive ? 'bg-light' : ''">


        <!--b-card-group deck-->
        <b-card 
            :header="player.tag + '\'s requests'"
            header-tag="header"
            class="mb-1"
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
    </div>
</template>
<script>
export default {
    props: ['player', 'game'],
    data() {
        return {
            isActive: false,
            newMessages: false
        }
    },
    methods: {
        signalActivePlayer(active) {
            console.log('Called');

            if (active) {
                this.isActive = true;
                this.newMessages = false;
            } else {
                this.isActive = false;
            }
        },
        signalNewMessage() {
            if (!this.isActive) {
                this.newMessages = true;
            } else {
                this.newMessages = false;
            }
        },
        setIsActive() {
            console.log(this.$props.player.id);
            console.log(this.$props.player);
            this.$parent.setSelectedPlayer(this.$props.player.id);
        }
    }
}
</script>
