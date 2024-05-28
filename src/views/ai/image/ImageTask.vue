
<template>
  <el-card class="dr-task" body-class="task-card" shadow="never">
    <template #header>绘画任务</template>
    <ImageTaskCard
      v-for="image in imageList"
      :key="image"
      :image-detail="image"
      @on-btn-click="handlerImageBtnClick" />
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

const message = useMessage() // 消息弹窗

const imageList = ref<ImageDetailVO[]>([]) // image 列表
const imageListInterval = ref<any>() // image 列表定时器，刷新列表
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
  } else if (type === 'delete') {
    await message.confirm(`是否删除照片?`)
    await ImageApi.deleteImage(imageDetail.id)
    await getImageList()
    await message.success("删除成功!")
  }
}
//
defineExpose({getImageList})
//
onMounted(async () => {
  // 获取 image 列表
  await getImageList()
  // 自动刷新 image 列表
  imageListInterval.value = setInterval(async () => {
    await getImageList()
  }, 3000)
})
//
onUnmounted(async () => {

})
</script>

<style lang="scss">
.task-card {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  height: 100%;
  overflow: auto;

  >div {
    margin-right: 20px;
    margin-bottom: 20px;
  }
}
</style>

<style scoped lang="scss">
.dr-task {
  width: 100%;
  height: 100%;
}
</style>
