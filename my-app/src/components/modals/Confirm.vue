<template>
    <Modal v-model="$parent.modals.confirm.show" :title="$parent.modals.confirm.title">
        <div class="container">
            <div class="row mb-3">
                {{ $parent.modals.confirm.description }}
            </div>

            <div class="row">
                <div class="col-6">
                    <div class="row justify-content-center">
                        <b-button variant="danger" @click="confirm()">{{ $parent.resolvePlaceHolder('confirm-button') }}</b-button>
                    </div>
                </div>
                <div class="col-6">
                    <div class="row justify-content-center">
                        <b-button @click="cancel()">{{ $parent.resolvePlaceHolder('cancel-button') }}</b-button>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
</template>
<script>
import VueModal from '@kouts/vue-modal'
import '@kouts/vue-modal/dist/vue-modal.css'

export default {
    props: ['warningList'],
    data() {
        return {
        };
    },
    components: {
        'Modal': VueModal
    },
    methods: {
        confirm () {
            this.$parent.modals.confirm.confirm();
        }, cancel() {
            this.$parent.modals.confirm.cancel();
        }
    }
}
</script>
