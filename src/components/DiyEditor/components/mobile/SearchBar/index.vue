<template>
  <div
    class="search-bar"
    :style="{
      color: property.textColor
    }"
  >
    <!-- 搜索框 -->
    <div
      class="inner"
      :style="{
        height: `${property.height}px`,
        background: property.backgroundColor,
        borderRadius: `${property.borderRadius}px`
      }"
    >
      <div
        class="placeholder"
        :style="{
          justifyContent: property.placeholderPosition
        }"
      >
        <Icon icon="ep:search" />
        <span>{{ property.placeholder || '搜索商品' }}</span>
      </div>
      <div class="right">
        <!-- 搜索热词 -->
        <span v-for="(keyword, index) in property.hotKeywords" :key="index">{{ keyword }}</span>
        <!-- 扫一扫 -->
        <Icon icon="ant-design:scan-outlined" v-show="property.showScan" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SearchProperty } from './config'
/** 搜索框 */
defineOptions({ name: 'SearchBar' })
defineProps<{ property: SearchProperty }>()
</script>

<style scoped lang="scss">
.search-bar {
  /* 搜索框 */
  .inner {
    position: relative;
    display: flex;
    min-height: 28px;
    font-size: 14px;
    align-items: center;

    .placeholder {
      display: flex;
      width: 100%;
      padding: 0 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-all;
      white-space: nowrap;
      align-items: center;
      gap: 2px;
    }

    .right {
      position: absolute;
      right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
  }
}
</style>
