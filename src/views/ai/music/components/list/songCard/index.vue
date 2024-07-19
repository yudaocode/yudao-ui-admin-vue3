<template>
  <div class="flex bg-[var(--el-bg-color-overlay)] p-12px mb-12px rounded-1">
    <el-image :src="songInfo.imageUrl" class="flex-none w-80px"/>
    <div class="ml-8px">
      <div>{{ songInfo.title }}</div>
      <div class="mt-8px text-12px text-[var(--el-text-color-secondary)] line-clamp-2">
        {{ songInfo.desc }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>

defineOptions({ name: 'Index' })

defineProps({
  songInfo: {
    type: Object,
    default: () => ({})
  }
})
</script>
