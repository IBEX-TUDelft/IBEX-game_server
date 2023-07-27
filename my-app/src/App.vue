<template>
  <b-container fluid id="app" class="px-0 vh-100">
    <b-row class="min-vh-100 no-gutters">
      <router-view />
    </b-row>

  </b-container>
</template>

<script>

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

export default {
  name: 'App'
}
</script>

<style>
@import './assets/styles/global.css';
</style>