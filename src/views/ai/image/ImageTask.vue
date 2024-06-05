<template>
  <el-card class="dr-task" body-class="task-card" shadow="never">
    <template #header>绘画任务</template>
    <ImageTaskCard
      v-for="image in imageList"
      :key="image"
      :image-detail="image"
      @on-btn-click="handlerImageBtnClick"
      @on-mj-btn-click="handlerImageMjBtnClick"/>
  </el-card>
  <!-- 图片 detail 抽屉 -->
  <ImageDetailDrawer
    :show="isShowImageDetail"
    :id="showImageDetailId"
    @handler-drawer-close="handlerDrawerClose"
  />
</template>
<script setup lang="ts">
import {ImageApi, ImageDetailVO, ImageMjButtonsVO} from '@/api/ai/image';
import ImageDetailDrawer from './ImageDetailDrawer.vue'
import ImageTaskCard from './ImageTaskCard.vue'

const message = useMessage() // 消息弹窗

const imageList = ref<ImageDetailVO[]>([]) // image 列表
const imageListInterval = ref<any>() // image 列表定时器，刷新列表
const isShowImageDetail = ref<boolean>(false) // 是否显示 task 详情
const showImageDetailId = ref<number>(0) // 是否显示 task 详情

/**  抽屉 - close  */
const handlerDrawerClose = async () => {
  isShowImageDetail.value = false
}

/**  任务 - detail  */
const handlerDrawerOpen = async () => {
  isShowImageDetail.value = true
}

/**
 * 获取 - image 列表
 */
const getImageList = async () => {
  const { list } = await ImageApi.getImageList({pageNo: 1, pageSize: 20})
  imageList.value = list
}

/**  图片 - btn click  */
const handlerImageBtnClick = async (type, imageDetail: ImageDetailVO) => {
  // 获取 image detail id
  showImageDetailId.value = imageDetail.id
  // 处理不用 btn
  if (type === 'more') {
    await handlerDrawerOpen()
  } else if (type === 'delete') {
    await message.confirm(`是否删除照片?`)
    await ImageApi.deleteImage(imageDetail.id)
    await getImageList()
    await message.success("删除成功!")
  } else if (type === 'download') {
    await downloadImage(imageDetail.picUrl)
  }
}

/**  图片 - mj btn click  */
const handlerImageMjBtnClick = async (button: ImageMjButtonsVO, imageDetail: ImageDetailVO) => {
  console.log('mj click', button, imageDetail)
}

/**  下载 - image  */
// TODO @fan：貌似可以考虑抽到 download 里面，作为一个方法
const downloadImage = async (imageUrl) => {
  const image = new Image()
  image.setAttribute('crossOrigin', 'anonymous')
  image.src = imageUrl
  image.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, image.width, image.height)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'image.png'
    a.click()
  }
}

/** 暴露组件方法 */
defineExpose({getImageList})

/** 组件挂在的时候 */
onMounted(async () => {
  // 获取 image 列表
  await getImageList()
  // 自动刷新 image 列表
  imageListInterval.value = setInterval(async () => {
    await getImageList()
  }, 1000 * 20)
})

/** 组件取消挂在的时候 */
onUnmounted(async () => {
  if (imageListInterval.value) {
    clearInterval(imageListInterval.value)
  }
})
</script>

<style lang="scss">
.task-card {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
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
