<template>
    <b-col><div class="d-flex flex-column h-100">

    <Header />

    <b-tabs content-class="mt-3">
        <b-tab title="Voting" active><p></p></b-tab>
        <b-tab title="Harberger"><p></p></b-tab>
        <b-tab title="Futarchy"><p></p></b-tab>
    </b-tabs>

    </div></b-col>
</template>
<script lang="ts">
import Header from './Header.vue'

export default {
    components: {
        Header
    },
}
</script>