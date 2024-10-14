<template>
  <div
    v-for="(item, index) in property.list"
    :key="index"
    class="absolute bottom-50% right-50% h-454px w-292px border-1px border-gray border-rounded-4px border-solid bg-white p-1px"
    :style="{
      zIndex: 100 + index + (activeIndex === index ? 100 : 0),
      marginRight: `${-146 - index * 20}px`,
      marginBottom: `${-227 - index * 20}px`
    }"
    @click="handleActive(index)"
  >
    <el-image :src="item.imgUrl" fit="contain" class="h-full w-full">
      <template #error>
        <div class="h-full w-full flex items-center justify-center">
          <Icon icon="ep:picture" />
        </div>
      </template>
    </el-image>
    <div class="absolute right-1 top-1 text-12px">{{ index + 1 }}</div>
  </div>
</template>
<script setup lang="ts">
import { PopoverProperty } from './config'

/** 弹窗广告 */
defineOptions({ name: 'Popover' })
// 定义属性
defineProps<{ property: PopoverProperty }>()

// 处理选中
const activeIndex = ref(0)
const handleActive = (index: number) => {
  activeIndex.value = index
}
</script>

<style scoped lang="scss"></style>
