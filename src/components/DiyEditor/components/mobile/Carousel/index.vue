<template>
  <!-- 无图片 -->
  <div
    class="h-250px flex items-center justify-center bg-gray-3"
    v-if="property.items.length === 0"
  >
    <Icon icon="tdesign:image" class="text-gray-8 text-120px!" />
  </div>
  <!-- 一行一个 -->
  <div
    v-if="property.swiperType === 0"
    class="flex flex-col"
    :style="{
      paddingLeft: property.pageMargin + 'px',
      paddingRight: property.pageMargin + 'px'
    }"
  >
    <div v-for="(item, index) in property.items" :key="index">
      <div
        class="img-item"
        :style="{
          marginBottom: property.imageMargin + 'px',
          borderRadius: property.borderRadius + 'px'
        }"
      >
        <img alt="" :src="item.imgUrl" />
        <div v-if="item.title" class="title">{{ item.title }}</div>
      </div>
    </div>
  </div>
  <el-carousel height="174px" v-else :type="property.swiperType === 3 ? 'card' : ''">
    <el-carousel-item v-for="(item, index) in property.items" :key="index">
      <div class="img-item" :style="{ borderRadius: property.borderRadius + 'px' }">
        <img alt="" :src="item.imgUrl" />
        <div v-if="item.title" class="title">{{ item.title }}</div>
      </div>
    </el-carousel-item>
  </el-carousel>
</template>
<script setup lang="ts">
import { CarouselProperty } from './config'

/** 页面顶部导航栏 */
defineOptions({ name: 'NavigationBar' })

const props = defineProps<{ property: CarouselProperty }>()
</script>

<style scoped lang="scss">
.img-item {
  width: 100%;
  position: relative;
  overflow: hidden;
  &:last-child {
    margin: 0 !important;
  }
  /* 图片 */
  img {
    width: 100%;
    height: 100%;
    display: block;
  }
  .title {
    height: 36px;
    width: 100%;
    background-color: rgba(51, 51, 51, 0.8);
    text-align: center;
    line-height: 36px;
    color: #fff;
    position: absolute;
    bottom: 0;
    left: 0;
  }
}
</style>
