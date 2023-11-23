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
  position: relative;
  width: 100%;
  min-height: 20px;
  padding: 8px 16px;
  border: 2px solid #fff;
  box-sizing: border-box;

  /* 更多 */
  .more {
    position: absolute;
    top: 0;
    right: 8px;
    bottom: 0;
    display: flex;
    margin: auto;
    font-size: 10px;
    color: #969799;
    align-items: center;
    justify-content: center;
  }
}
</style>
