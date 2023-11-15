<template>
    <div>
        <canvas ref="canvas" id="myCanvas" :style="computedStyle"></canvas>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { bindCameraMouseControlEvent, bindKeyDownEvent } from "@/core/setup-lab4";
import { init } from "@/core/drawwebgl-new";
const props = defineProps({
    width: {
        type: Number,
        default: 700
    },
    height: {
        type: Number,
        default: 700
    }
})
const computedStyle = computed(() => {
    return {
        width: props.width + "px",
        height: props.height + "px"
    }
})

const canvas = ref<HTMLCanvasElement | null>(null);
onMounted(async () => {
    const canvasComponent = canvas.value as HTMLCanvasElement;
    // bindMouseEvent(canvasComponent)
    bindKeyDownEvent()
    bindCameraMouseControlEvent()
    await init(canvasComponent)
})

watch(() => props.width + props.height, () => {
    // const canvasComponent = canvas.value as HTMLCanvasElement;
    // init(canvasComponent, false)
})

</script>

<style scoped>
#myCanvas {
    box-sizing: border-box;
}

.circular-pointer {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: red;
    position: absolute;
    transform: translate(-50%, -50%);
}
</style>