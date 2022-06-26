<template>
    <Modal v-model="$parent.modals.errorList.show" title="Warning">
        <div class="container">
            <div class="row">
                {{ $parent.modals.errorList.description }}
            </div>

            <div class="row">
                <ul>
                    <li v-for="warning in $parent.modals.errorList.warnings" :key="warning" class="row-12">
                        {{ warning }}
                    </li>
                </ul>
            </div>

            <div class="row">
                <div class="col-6">
                    <div class="row justify-content-center">
                        <b-button variant="danger" @click="confirm()">Confirm</b-button>
                    </div>
                </div>
                <div class="col-6">
                    <div class="row justify-content-center">
                        <b-button @click="cancel()">Cancel</b-button>
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
            this.$parent.modals.errorList.show = false;
            if (this.$parent.modals.errorList.callback != null) {
                this.$parent.modals.errorList.callback();
            }
        }, cancel() {
            this.$parent.modals.errorList.show = false;
        }
    }
}
</script>
