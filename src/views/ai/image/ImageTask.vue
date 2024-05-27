
<template>
  <el-card class="dr-task" body-class="task-card" shadow="never">
    <template #header>绘画任务</template>
    <ImageTaskCard v-for="image in imageList" :key="image" :image-detail="image" @on-btn-click="handlerImageBtnClick" />
  </el-card>
  <!-- 图片 detail 抽屉 -->
  <ImageDetailDrawer
    :show="showTaskDetail"
    @handler-drawer-close="handlerDrawerClose"
  />
</template>
<script setup lang="ts">
import {ImageApi, ImageDetailVO} from '@/api/ai/image';
import ImageDetailDrawer from './ImageDetailDrawer.vue'
import ImageTaskCard from './ImageTaskCard.vue'
import {bool} from "vue-types";

const imageList = ref<ImageDetailVO[]>([]) // image 列表
const showTaskDetail = ref<bool>(false) // 是否显示 task 详情

/**
 * 图片人物 - detail
 */
const handlerTaskDetail = async () => {
  showTaskDetail.value = !showTaskDetail.value
}

/**
 * 抽屉 - close
 */
const handlerDrawerClose = async () => {
  showTaskDetail.value = false
}

/**
 * 任务 - detail
 */
const handlerDrawerOpen = async () => {
  showTaskDetail.value = true
}

/**
 * 获取 - image 列表
 */
const getImageList = async () => {
  const { list } = await ImageApi.getImageList({pageNo: 1, pageSize: 20})
  imageList.value = list
}

/**
 * 图片 - btn click
 */
const handlerImageBtnClick = async (type, imageDetail: ImageDetailVO) => {
  if (type === 'more') {
    await handlerDrawerOpen()
  }
}

//
onMounted(async () => {
  await getImageList()
})
</script>

<style lang="scss">
.task-card {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  >div {
    margin-right: 20px;
  }
}
</style>

<style scoped lang="scss">
.dr-task {
  width: 100%;
  height: 100%;
}
</style>
