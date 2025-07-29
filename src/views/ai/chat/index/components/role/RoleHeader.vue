<!-- header -->
<template>
  <el-header class="flex flex-row justify-between items-center px-10px whitespace-nowrap text-ellipsis w-full" :style="{ backgroundColor: 'var(--el-bg-color-page)' }">
    <div class="text-20px font-bold overflow-hidden max-w-220px" :style="{ color: 'var(--el-text-color-primary)' }">
      {{ title }}
    </div>
    <div class="flex flex-row">
      <slot></slot>
    </div>
  </el-header>
</template>

<script setup lang="ts">
// 设置组件属性
defineProps({
  title: {
    type: String,
    required: true
  }
})
</script>
