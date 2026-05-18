<template>
  <div class="relative h-full min-h-30px w-full">
    <el-image :src="property.imgUrl" class="pointer-events-none h-full w-full select-none" />
    <div
      v-for="(item, index) in property.list"
      :key="index"
      class="hot-zone"
      :style="{
        width: `${item.width}px`,
        height: `${item.height}px`,
        top: `${item.top}px`,
        left: `${item.left}px`
      }"
    >
      {{ item.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { HotZoneProperty } from './config'

/** 热区 */
defineOptions({ name: 'HotZone' })
const props = defineProps<{ property: HotZoneProperty }>()
</script>

<style scoped lang="scss">
.hot-zone {
  position: absolute;
  z-index: 10;
  display: flex;
  font-size: 14px;
  color: var(--el-color-primary);
  cursor: move;
  background: var(--el-color-primary-light-7);
  border: 1px solid var(--el-color-primary);
  opacity: 0.8;
  align-items: center;
  justify-content: center;
}
</style>
