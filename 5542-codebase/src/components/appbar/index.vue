<template>
    <div>
        <v-app-bar>
            <v-app-bar-title style="text-align: left; font-style: italic">CSE 5542-Lab 2</v-app-bar-title>
            <template v-slot:append>
                Target: &nbsp;<v-btn class="indicator-btn" :icon="iconShape" :color="selectedColor" :style="{transform: selectedShape.includes('vertical')?'rotate(90deg)':'none', border: getBorder}"></v-btn>
            </template>
        </v-app-bar>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { selectedShape, shapeIconMapping, selectedColor } from "@/core/setup-lab2"

const iconShape = computed(() => {
    return shapeIconMapping[selectedShape.value]
})

const getBorder = ref("none")

watch(() => selectedShape.value + selectedColor.value, () => {
    getBorder.value = `1.5px solid rgb(23, 83, 181)`
    setTimeout(() => {
        getBorder.value = "none" 
    }, 1000);
})
</script>

<style scoped>
.indicator-btn{
    transition-property: border;
    transition-duration: 0.5s;
}
</style>@/core/setup-lab1@/core/setup-lab2