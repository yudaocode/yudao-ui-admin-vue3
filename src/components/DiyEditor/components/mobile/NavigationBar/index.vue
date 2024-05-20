<template>
  <div class="navigation-bar" :style="bgStyle">
    <div class="h-full w-full flex items-center">
      <div v-for="(cell, cellIndex) in cellList" :key="cellIndex" :style="getCellStyle(cell)">
        <span v-if="cell.type === 'text'">{{ cell.text }}</span>
        <img v-else-if="cell.type === 'image'" :src="cell.imgUrl" alt="" class="h-full w-full" />
        <SearchBar v-else :property="getSearchProp" />
      </div>
    </div>
    <img
      v-if="property._local?.previewMp"
      src="@/assets/imgs/diy/app-nav-bar-mp.png"
      alt=""
      class="h-30px w-86px"
    />
  </div>
</template>
<script setup lang="ts">
import { NavigationBarCellProperty, NavigationBarProperty } from './config'
import SearchBar from '@/components/DiyEditor/components/mobile/SearchBar/index.vue'
import { StyleValue } from 'vue'
import { SearchProperty } from '@/components/DiyEditor/components/mobile/SearchBar/config'

/** 页面顶部导航栏 */
defineOptions({ name: 'NavigationBar' })

const props = defineProps<{ property: NavigationBarProperty }>()

// 背景
const bgStyle = computed(() => {
  const background =
    props.property.bgType === 'img' && props.property.bgImg
      ? `url(${props.property.bgImg}) no-repeat top center / 100% 100%`
      : props.property.bgColor
  return { background }
})
// 单元格列表
const cellList = computed(() =>
  props.property._local?.previewMp ? props.property.mpCells : props.property.otherCells
)
// 单元格宽度
const cellWidth = computed(() => {
  return props.property._local?.previewMp ? (375 - 80 - 86) / 6 : (375 - 90) / 8
})
// 获得单元格样式
const getCellStyle = (cell: NavigationBarCellProperty) => {
  return {
    width: cell.width * cellWidth.value + (cell.width - 1) * 10 + 'px',
    left: cell.left * cellWidth.value + (cell.left + 1) * 10 + 'px',
    position: 'absolute'
  } as StyleValue
}
// 获得搜索框属性
const getSearchProp = (cell: NavigationBarCellProperty) => {
  return {
    height: 30,
    showScan: false,
    placeholder: cell.placeholder,
    borderRadius: cell.borderRadius
  } as SearchProperty
}
</script>
<style lang="scss" scoped>
.navigation-bar {
  display: flex;
  height: 50px;
  background: #fff;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px;

  /* 左边 */
  .left {
    margin-left: 8px;
  }

  .center {
    font-size: 14px;
    line-height: 35px;
    color: #333;
    text-align: center;
    flex: 1;
  }

  /* 右边 */
  .right {
    margin-right: 8px;
  }
}
</style>
