<template>
    <Modal v-model="$parent.modals.acknowledge.show" :title="$parent.modals.acknowledge.title">
        <div class="container">
            <div class="row mb-3">
                {{ $parent.modals.acknowledge.description }}
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="row justify-content-center">
                        <b-button variant="primary" @click="acknowledge()">{{ $parent.resolvePlaceHolder('acknowledge-button') }}</b-button>
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
        acknowledge () {
            this.$parent.modals.acknowledge.show = false;
        }
    }
}
</script>
