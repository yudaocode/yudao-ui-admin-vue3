<template>
  <div
    class="title-bar"
    :style="{
      background: property.backgroundColor,
      borderBottom: property.showBottomBorder ? '1px solid #F9F9F9' : '1px solid #fff'
    }"
  >
    <div>
      <!-- 标题 -->
      <div
        :style="{
          fontSize: `${property.titleSize}px`,
          fontWeight: property.titleWeight,
          color: property.titleColor,
          textAlign: property.position
        }"
        v-if="property.title"
      >
        {{ property.title }}
      </div>
      <!-- 副标题 -->
      <div
        :style="{
          fontSize: `${property.descriptionSize}px`,
          fontWeight: property.descriptionWeight,
          color: property.descriptionColor,
          textAlign: property.position
        }"
        class="m-t-8px"
        v-if="property.description"
      >
        {{ property.description }}
      </div>
    </div>
    <!-- 更多 -->
    <div
      class="more"
      v-show="property.more.show"
      :style="{
        color: property.more.type === 'text' ? '#38f' : ''
      }"
    >
      {{ property.more.type === 'icon' ? '' : property.more.text }}
      <Icon icon="ep:arrow-right" v-if="property.more.type !== 'text'" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { TitleBarProperty } from './config'

/** 标题栏 */
defineOptions({ name: 'TitleBar' })

defineProps<{ property: TitleBarProperty }>()
</script>
<style scoped lang="scss">
.title-bar {
  border: 2px solid #fff;
  box-sizing: border-box;
  width: 100%;
  padding: 8px 16px;
  min-height: 20px;
  position: relative;

  /* 更多 */
  .more {
    position: absolute;
    right: 8px;
    top: 0;
    bottom: 0;
    margin: auto;
    font-size: 10px;
    color: #969799;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
