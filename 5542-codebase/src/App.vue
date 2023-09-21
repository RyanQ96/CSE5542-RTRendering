<template>
  <v-layout class="app-layout">
    <appbar />
    <v-main>
      <card></card>
    </v-main>
  </v-layout>
</template>
<script setup lang="ts">
import appbar from "./components/appbar/index.vue"
import card from "./components/webglCanvas/card.vue"

</script>
<style>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
