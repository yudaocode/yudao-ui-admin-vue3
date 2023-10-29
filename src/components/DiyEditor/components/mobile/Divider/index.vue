<template>
  <div
    class="flex items-center"
    :style="{
      height: property.height + 'px'
    }"
  >
    <div
      class="w-full"
      :style="{
        borderTopStyle: property.borderType,
        borderTopColor: property.lineColor,
        borderTopWidth: `${property.lineWidth}px`,
        margin: property.paddingType === 'none' ? '0' : '0px 16px'
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { DividerProperty } from './config'

/** 页面顶部导航栏 */
defineOptions({ name: 'Divider' })

defineProps<{ property: DividerProperty }>()
</script>

<style scoped lang="scss"></style>
