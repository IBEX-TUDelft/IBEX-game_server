<template>
    <div @click="setIsActive()">

        <div class="row">
            <div class="col-11">
                {{ player.tag }}
            </div>
            <div class="col-1">
                {{ !isActive && newMessages ? '*' : '' }}
            </div>
        </div>

        <b-card v-for="condition in game.conditions" :key="condition.id"
            :header="condition.tag"
            header-tag="header"
        >
            <div class="row">
                <div class="col-6">
                    Value
                </div>
                <div class="col-6">
                    Last Offer
                </div>
            </div>
            <div class="row">
                <div class="col-6">
                    {{ player.property.value[condition.id] != null ?  player.property.value[condition.id] : null }}
                </div>
                <div class="col-6">
                    {{ player.property.lastOffer[condition.id] != null ?  player.property.lastOffer[condition.id] : null }}
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
        signalActivePlayer(number) {
            if (this.$props.player.number === number) {
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
        }
    }
}
</script>
