<template>
  <div
    :style="{
      background:
        property.style.bgType === 'color' ? property.style.bgColor : `url(${property.style.bgImg})`,
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat'
    }"
    class="title-bar"
  >
    <!-- 内容 -->
    <div>
      <!-- 标题 -->
      <div
        v-if="property.title"
        :style="{
          fontSize: `${property.titleSize}px`,
          fontWeight: property.titleWeight,
          color: property.titleColor,
          textAlign: property.textAlign
        }"
      >
        {{ property.title }}
      </div>
      <!-- 副标题 -->
      <div
        v-if="property.description"
        :style="{
          fontSize: `${property.descriptionSize}px`,
          fontWeight: property.descriptionWeight,
          color: property.descriptionColor,
          textAlign: property.textAlign
        }"
        class="m-t-8px"
      >
        {{ property.description }}
      </div>
    </div>
    <!-- 更多 -->
    <div
      v-show="property.more.show"
      :style="{
        color: property.descriptionColor
      }"
      class="more"
    >
      <span v-if="property.more.type !== 'icon'"> {{ property.more.text }} </span>
      <Icon v-if="property.more.type !== 'text'" icon="ep:arrow-right" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { TitleBarProperty } from './config'

/** 标题栏 */
defineOptions({ name: 'TitleBar' })

defineProps<{ property: TitleBarProperty }>()
</script>
<style lang="scss" scoped>
.title-bar {
  position: relative;
  width: 100%;
  min-height: 20px;
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
