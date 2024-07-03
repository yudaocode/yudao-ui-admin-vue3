<template>
  <el-card class="dr-task" body-class="task-card" shadow="never">
    <template #header>绘画任务</template>
    <div class="task-image-list" ref="imageTaskRef">
      <ImageTaskCard
        v-for="image in imageList"
        :key="image"
        :image-detail="image"
        @on-btn-click="handlerImageBtnClick"
        @on-mj-btn-click="handlerImageMjBtnClick"
      />
    </div>
    <div class="task-image-pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :default-page-size="pageSize"
        :total="pageTotal"
        @change="handlerPageChange"
      />
    </div>
  </el-card>
  <!-- 图片 detail 抽屉 -->
  <ImageDetailDrawer
    :show="isShowImageDetail"
    :id="showImageDetailId"
    @handler-drawer-close="handlerDrawerClose"
  />
</template>
<script setup lang="ts">
import { ImageApi, ImageVO, ImageMjActionVO, ImageMjButtonsVO } from '@/api/ai/image'
import ImageDetailDrawer from './ImageDetailDrawer.vue'
import ImageTaskCard from './ImageTaskCard.vue'
import { ElLoading, LoadingOptionsResolved } from 'element-plus'
import { AiImageStatusEnum } from '@/views/ai/utils/constants'

const message = useMessage() // 消息弹窗

const imageList = ref<ImageVO[]>([]) // image 列表
const inProgressImageMap = ref<{}>({}) // 监听的 image 映射，一般是生成中（需要轮询），key 为 image 编号，value 为 image
const imageListInterval = ref<any>() // image 列表定时器，刷新列表
const isShowImageDetail = ref<boolean>(false) // 是否显示 task 详情
const showImageDetailId = ref<number>(0) // 是否显示 task 详情
const imageTaskRef = ref<any>() // ref
const imageTaskLoadingInstance = ref<any>() // loading
const imageTaskLoading = ref<boolean>(false) // loading
const pageNo = ref<number>(1) // page no
const pageSize = ref<number>(10) // page size
const pageTotal = ref<number>(0) // page size

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
const getImageList = async (apply: boolean = false) => {
  imageTaskLoading.value = true
  try {
    imageTaskLoadingInstance.value = ElLoading.service({
      target: imageTaskRef.value,
      text: '加载中...'
    } as LoadingOptionsResolved)
    const { list, total } = await ImageApi.getImagePageMy({
      pageNo: pageNo.value,
      pageSize: pageSize.value
    })
    if (apply) {
      imageList.value = [...imageList.value, ...list]
    } else {
      imageList.value = list
    }
    pageTotal.value = total
    // 需要 watch 的数据
    const newWatImages = {}
    imageList.value.forEach((item) => {
      if (item.status === AiImageStatusEnum.IN_PROGRESS) {
        newWatImages[item.id] = item
      }
    })
    inProgressImageMap.value = newWatImages
  } finally {
    if (imageTaskLoadingInstance.value) {
      imageTaskLoadingInstance.value.close()
      imageTaskLoadingInstance.value = null
    }
  }
}

/** 轮询生成中的 image 列表 */
const refreshWatchImages = async () => {
  const imageIds = Object.keys(inProgressImageMap.value).map(Number)
  if (imageIds.length == 0) {
    return
  }
  const list = (await ImageApi.getImageListMyByIds(imageIds)) as ImageVO[]
  const newWatchImages = {}
  list.forEach((image) => {
    if (image.status === AiImageStatusEnum.IN_PROGRESS) {
      newWatchImages[image.id] = image
    } else {
      const index = imageList.value.findIndex((oldImage) => image.id === oldImage.id)
      if (index >= 0) {
        // 更新 imageList
        imageList.value[index] = image
      }
    }
  })
  inProgressImageMap.value = newWatchImages
}

/**  图片 - btn click  */
const handlerImageBtnClick = async (type: string, imageDetail: ImageVO) => {
  // 获取 image detail id
  showImageDetailId.value = imageDetail.id
  // 处理不用 btn
  if (type === 'more') {
    await handlerDrawerOpen()
  } else if (type === 'delete') {
    await message.confirm(`是否删除照片?`)
    await ImageApi.deleteImageMy(imageDetail.id)
    await getImageList()
    message.success('删除成功!')
  } else if (type === 'download') {
    await downloadImage(imageDetail.picUrl)
  }
}

/**  图片 - mj btn click  */
const handlerImageMjBtnClick = async (button: ImageMjButtonsVO, imageDetail: ImageVO) => {
  // 1、构建 params 参数
  const data = {
    id: imageDetail.id,
    customId: button.customId
  } as ImageMjActionVO
  // 2、发送 action
  await ImageApi.midjourneyAction(data)
  // 3、刷新列表
  await getImageList()
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
    const ctx = canvas.getContext('2d') as CanvasDrawImage
    ctx.drawImage(image, 0, 0, image.width, image.height)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'image.png'
    a.click()
  }
}

// page change
const handlerPageChange = async (page) => {
  pageNo.value = page
  await getImageList(false)
}

/** 暴露组件方法 */
defineExpose({ getImageList })

/** 组件挂在的时候 */
onMounted(async () => {
  // 获取 image 列表
  await getImageList()
  // 自动刷新 image 列表
  imageListInterval.value = setInterval(async () => {
    await refreshWatchImages()
  }, 1000 * 3)
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
  margin: 0;
  padding: 0;
  height: 100%;
  position: relative;
}

.task-image-list {
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: flex-start;
  height: 100%;
  overflow: auto;
  padding: 20px;
  padding-bottom: 140px;
  box-sizing: border-box; /* 确保内边距不会增加高度 */

  > div {
    margin-right: 20px;
    margin-bottom: 20px;
  }
  > div:last-of-type {
    //margin-bottom: 100px;
  }
}

.task-image-pagination {
  position: absolute;
  bottom: 60px;
  height: 50px;
  line-height: 90px;
  width: 100%;
  z-index: 999;
  background-color: #ffffff;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
</style>

<style scoped lang="scss">
.dr-task {
  width: 100%;
  height: 100%;
}
</style>
