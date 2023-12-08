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
        <el-image :src="index === 0 ? item.activeIconUrl : item.iconUrl">
          <template #error>
            <div class="h-full w-full flex items-center justify-center">
              <Icon icon="ep:picture" />
            </div>
          </template>
        </el-image>
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
  z-index: 2;
  width: 100%;

  .tab-bar-bg {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    padding: 8px 0;

    .tab-bar-item {
      display: flex;
      width: 100%;
      font-size: 12px;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      :deep(img),
      .el-icon {
        width: 26px;
        height: 26px;
        border-radius: 4px;
      }
    }
  }
}
</style>
