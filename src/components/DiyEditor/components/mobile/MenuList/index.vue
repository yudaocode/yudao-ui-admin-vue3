<template>
  <div class="min-h-42px flex flex-col">
    <div
      v-for="(item, index) in property.list"
      :key="index"
      class="item h-42px flex flex-row items-center justify-between gap-4px p-x-12px"
    >
      <div class="flex flex-1 flex-row items-center gap-8px">
        <el-image v-if="item.iconUrl" class="h-16px w-16px" :src="item.iconUrl" />
        <span class="text-16px" :style="{ color: item.titleColor }">{{ item.title }}</span>
      </div>
      <div class="item-center flex flex-row justify-center gap-4px">
        <span class="text-12px" :style="{ color: item.subtitleColor }">{{ item.subtitle }}</span>
        <Icon icon="ep-arrow-right" color="#000" :size="16" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MenuListProperty } from './config'
/** 列表导航 */
defineOptions({ name: 'MenuList' })
defineProps<{ property: MenuListProperty }>()
</script>

<style scoped lang="scss">
.item + .item {
  border-top: 1px solid #eee;
}
</style>
