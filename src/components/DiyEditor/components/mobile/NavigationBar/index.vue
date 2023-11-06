<template>
  <div
    class="navigation-bar"
    :style="{
      height: `${property.navBarHeight}px`,
      backgroundColor: property.backgroundColor,
      backgroundImage: `url(${property.backgroundImage})`
    }"
  >
    <!-- 左侧 -->
    <div class="left">
      <Icon icon="ep:arrow-left" v-show="property.showGoBack" />
    </div>
    <!-- 中间 -->
    <div
      class="center"
      :style="{
        height: `${property.navBarHeight}px`,
        lineHeight: `${property.navBarHeight}px`
      }"
    >
      {{ property.title }}
    </div>
    <!-- 右侧 -->
    <div class="right"></div>
  </div>
</template>
<script setup lang="ts">
import { NavigationBarProperty } from './config'

/** 页面顶部导航栏 */
defineOptions({ name: 'NavigationBar' })

defineProps<{ property: NavigationBarProperty }>()
</script>
<style lang="scss" scoped>
.navigation-bar {
  height: 35px;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* 左边 */
  .left {
    margin-left: 8px;
  }
  .center {
    flex: 1;
    text-align: center;
    font-size: 14px;
    line-height: 35px;
    color: #333333;
  }
  /* 右边 */
  .right {
    margin-right: 8px;
  }
}
</style>
