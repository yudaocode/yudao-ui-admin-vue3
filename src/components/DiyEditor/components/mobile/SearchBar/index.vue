<template>
  <div
    class="search-bar"
    :style="{
      background: property.backgroundColor,
      border: `1px solid ${property.backgroundColor}`,
      color: property.textColor
    }"
  >
    <!-- 搜索框 -->
    <div
      class="inner"
      :style="{
        height: `${property.height}px`,
        background: property.borderColor,
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
  position: relative;
  /* 搜索框 */
  .inner {
    position: relative;
    width: calc(100% - 16px);
    min-height: 28px;
    margin: 5px auto;
    display: flex;
    align-items: center;
    font-size: 14px;

    .placeholder {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 0 8px;
      gap: 2px;
      text-overflow: ellipsis;
      overflow: hidden;
      word-break: break-all;
      white-space: nowrap;
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
