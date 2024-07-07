<template>
  <div class="mb-12px">
    <div class="flex text-[var(--el-text-color-primary)] justify-between items-center">
      <span>{{title}}</span>
      <slot name="extra"></slot>
    </div>
    <div class="text-[var(--el-text-color-secondary)] text-12px my-8px">
      {{desc}}
    </div>
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'Index' })

defineProps({
  title: {
    type: String
  },
  desc: {
    type: String
  }
})
</script>
