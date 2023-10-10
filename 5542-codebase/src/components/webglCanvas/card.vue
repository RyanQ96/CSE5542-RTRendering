<template>
    <h1 style="padding-bottom: 10px; text-align: center; font-size: 2rem">{{globalMode ? "Global Mode" : "Local Mode"}}</h1>
    <div ref="container" class="canvas-container"> 
        <inner :width="width" :height="height"/>
    </div>
</template>

<script setup lang="ts">
import inner from './inner.vue';
import { ref, onMounted } from "vue"
import { globalMode } from "@/core/setup-lab2";
const container = ref<HTMLElement | null>(null);
const width = ref<number>(1400);
const height = ref<number>(700);

const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        width.value = entry.contentRect.width;
        height.value = entry.contentRect.height;
    }
});
onMounted( () => {
    resizeObserver.observe(container.value!);
}) 
</script>

<style scoped>
.canvas-container {
    resize: both;
    width: 1400px;
    height: 700px;
    background-color: black;
    overflow: hidden;
    box-sizing: border-box;
    margin: 0 auto;
    box-shadow: rgba(0, 0, 0, 0.45) -7.5px 7.5px 10px !important; 
    border: 0.5px solid rgb(204, 204, 204);
}


</style>