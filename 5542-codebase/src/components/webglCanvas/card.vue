<template>
    <h1 style="position: absolute; padding-bottom: 10px; text-align: center; font-size: 2rem"><v-btn class="indicator-btn" icon="mdi-rotate-360"
            style="background-color: transparant; " variant="text" @click="toggleFreeMode" :color="freeRotate?'green': 'black'"></v-btn></h1>
    <div ref="container" class="canvas-container">
        <inner :width="width" :height="height" />
    </div>
</template>

<script setup lang="ts">
import inner from './inner.vue';
import { ref, onMounted } from "vue"
import { toggleAutoRotateMode, freeRotate } from "@/core/drawwebgl-new";

const container = ref<HTMLElement | null>(null);
const width = ref<number>(window.innerWidth);
const height = ref<number>(window.innerHeight - 64);

const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        width.value = entry.contentRect.width;
        height.value = entry.contentRect.height;
    }
});

function toggleFreeMode() {
    toggleAutoRotateMode()
}

onMounted(() => {
    resizeObserver.observe(container.value!);
    width.value = container.value!.clientWidth;
    height.value = container.value!.clientHeight;
    console.log(width.value, height.value)
}) 
</script>

<style scoped>
.canvas-container {
    resize: both;
    width: 100%;
    height: 100%;
    background-color: black;
    overflow: hidden;
    box-sizing: border-box;
    margin: 0 auto;
    box-shadow: rgba(0, 0, 0, 0.45) -7.5px 7.5px 10px !important;
    border: 0.5px solid rgb(204, 204, 204);
}
</style>