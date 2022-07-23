<template>
<b-container fluid id="app" class="px-0 vh-100">
  <b-row class="min-vh-100 no-gutters">

    <!--b-col class="col" style="background-color: red;"><div class="d-flex flex-column h-100">

        <div class="row justify-content-center no-gutters" style="background-color: purple;">
          <div >
            <div style="height:150px">ROW 1 - fixed height</div>
          </div>
        </div>

        <div class="row justify-content-center flex-grow-1 no-gutters" style="background-color: blue;">
          <div >ROW 2 - grow remaining height</div>
        </div>

    </div></b-col-->


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