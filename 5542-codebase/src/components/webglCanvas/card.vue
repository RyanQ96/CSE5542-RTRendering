<template>
    <div ref="container" class="canvas-container"> 
        <inner :width="width" :height="height"/>
    </div>
</template>

<script setup lang="ts">
import inner from './inner.vue';
import { ref, onMounted } from "vue"

const container = ref<HTMLElement | null>(null);
const width = ref<number>(700);
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
    width: 700px;
    height: 700px;
    background-color: black;
    overflow: hidden;
    border-radius: 2%; 
    box-sizing: border-box;
}


</style>