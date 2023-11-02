<template>
  <div class="tab-bar">
    <div
      class="tab-bar-bg"
      :style="{
        background:
          property.style.bgType === 'color'
            ? property.style.bgColor
            : `url(${property.style.bgImg})`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat'
      }"
    >
      <div v-for="(item, index) in property.items" :key="index" class="tab-bar-item">
        <img :src="index === 0 ? item.activeIconUrl : item.iconUrl" alt="" />
        <span :style="{ color: index === 0 ? property.style.activeColor : property.style.color }">
          {{ item.text }}
        </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { TabBarProperty } from './config'

/** 页面底部导航栏 */
defineOptions({ name: 'TabBar' })

defineProps<{ property: TabBarProperty }>()
</script>
<style lang="scss" scoped>
.tab-bar {
  width: 100%;
  z-index: 2;
  .tab-bar-bg {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    padding: 8px 0;

    .tab-bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      width: 100%;

      img {
        width: 26px;
        height: 26px;
        border-radius: 4px;
      }
    }
  }
}
</style>
