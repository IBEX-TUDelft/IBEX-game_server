<template>
  <div id="app" class="container-fluid" style="padding: 0px;">
    <router-view/>
  </div>
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