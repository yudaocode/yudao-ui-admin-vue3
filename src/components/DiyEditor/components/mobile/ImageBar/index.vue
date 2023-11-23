<template>
  <!-- 无图片 -->
  <div class="h-50px flex items-center justify-center bg-gray-3" v-if="!property.imgUrl">
    <Icon icon="ep:picture" class="text-gray-8 text-30px!" />
  </div>
  <el-image class="min-h-30px" v-else :src="property.imgUrl" />
</template>
<script setup lang="ts">
import { ImageBarProperty } from './config'

/** 图片展示 */
defineOptions({ name: 'ImageBar' })

defineProps<{ property: ImageBarProperty }>()
</script>

<style scoped lang="scss">
/* 图片 */
img {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
