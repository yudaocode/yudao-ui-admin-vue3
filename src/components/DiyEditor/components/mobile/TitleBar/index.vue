<template>
  <div class="title-bar">
    <el-image v-if="property.bgImgUrl" :src="property.bgImgUrl" fit="cover" class="w-full" />
    <div class="absolute left-0 top-0 w-full">
      <!-- 标题 -->
      <div
        :style="{
          fontSize: `${property.titleSize}px`,
          fontWeight: property.titleWeight,
          color: property.titleColor,
          textAlign: property.textAlign
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
          textAlign: property.textAlign
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
        color: property.descriptionColor
      }"
    >
      <span v-if="property.more.type !== 'icon'"> {{ property.more.text }} </span>
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
