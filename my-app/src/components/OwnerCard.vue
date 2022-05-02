<template>
    <div @click="setIsActive()" :class="isActive ? 'bg-light' : ''">

        <div class="row">
            <div :class="'col-11 text-center' + (newMessages ? ' font-weight-bold font-italic' : '')">
                {{ player.tag }}
            </div>
            <div class="col-1">
                {{ !isActive && newMessages ? '*' : '' }}
            </div>
        </div>

        <!--b-card-group deck-->
        <b-card v-for="condition in game.conditions" :key="condition.id"
            :header="condition.name"
            header-tag="header"
            class="mb-1"
        >
            <div class="row">
                <div class="col-6 font-weight-bold">
                    Value
                </div>
                <div class="col-6 font-weight-bold">
                    Compensation Offer
                </div>
            </div>

            <div class="row">
                <div class="col-6">
                    {{ player.property != null && player.property.v != null && player.property.v[condition.id] != null ?  player.property.v[condition.id] : '-' }}
                </div>
                <div v-if="game.phase <= 3" class="col-6">
                    -
                </div>
                <div v-else class="col-6">
                    {{ player.property != null && player.property.lastOffer && player.property.lastOffer[condition.id] != null ?  player.property.lastOffer[condition.id] : '-' }}
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
