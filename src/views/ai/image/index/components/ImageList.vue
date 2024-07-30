<template>
  <el-card class="dr-task" body-class="task-card" shadow="never">
    <template #header>
      绘画任务
      <!-- TODO @fan：看看，怎么优化下这个样子哈。 -->
      <el-button @click="handleViewPublic">绘画作品</el-button>
    </template>
    <!-- 图片列表 -->
    <div class="task-image-list" ref="imageListRef">
      <ImageCard
        v-for="image in imageList"
        :key="image.id"
        :detail="image"
        @on-btn-click="handleImageButtonClick"
        @on-mj-btn-click="handleImageMidjourneyButtonClick"
      />
    </div>
    <div class="task-image-pagination">
      <Pagination
        :total="pageTotal"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getImageList"
      />
    </div>
  </el-card>

  <!-- 图片详情 -->
  <ImageDetail
    :show="isShowImageDetail"
    :id="showImageDetailId"
    @handle-drawer-close="handleDetailClose"
  />
</template>
<script setup lang="ts">
import {
  ImageApi,
  ImageVO,
  ImageMidjourneyActionVO,
  ImageMidjourneyButtonsVO
} from '@/api/ai/image'
import ImageDetail from './ImageDetail.vue'
import ImageCard from './ImageCard.vue'
import { ElLoading, LoadingOptionsResolved } from 'element-plus'
import { AiImageStatusEnum } from '@/views/ai/utils/constants'
import download from '@/utils/download'

const message = useMessage() // 消息弹窗
const router = useRouter() // 路由

// 图片分页相关的参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10
})
const pageTotal = ref<number>(0) // page size
const imageList = ref<ImageVO[]>([]) // image 列表
const imageListLoadingInstance = ref<any>() // image 列表是否正在加载中
const imageListRef = ref<any>() // ref
// 图片轮询相关的参数（正在生成中的）
const inProgressImageMap = ref<{}>({}) // 监听的 image 映射，一般是生成中（需要轮询），key 为 image 编号，value 为 image
const inProgressTimer = ref<any>() // 生成中的 image 定时器，轮询生成进展
// 图片详情相关的参数
const isShowImageDetail = ref<boolean>(false) // 图片详情是否展示
const showImageDetailId = ref<number>(0) // 图片详情的图片编号

/** 处理查看绘图作品 */
const handleViewPublic = () => {
  router.push({
    name: 'AiImageSquare'
  })
}

/** 查看图片的详情  */
const handleDetailOpen = async () => {
  isShowImageDetail.value = true
}

/** 关闭图片的详情  */
const handleDetailClose = async () => {
  isShowImageDetail.value = false
}

/** 获得 image 图片列表 */
const getImageList = async () => {
  try {
    // 1. 加载图片列表
    imageListLoadingInstance.value = ElLoading.service({
      target: imageListRef.value,
      text: '加载中...'
    } as LoadingOptionsResolved)
    const { list, total } = await ImageApi.getImagePageMy(queryParams)
    imageList.value = list
    pageTotal.value = total

    // 2. 计算需要轮询的图片
    const newWatImages = {}
    imageList.value.forEach((item) => {
      if (item.status === AiImageStatusEnum.IN_PROGRESS) {
        newWatImages[item.id] = item
      }
    })
    inProgressImageMap.value = newWatImages
  } finally {
    // 关闭正在“加载中”的 Loading
    if (imageListLoadingInstance.value) {
      imageListLoadingInstance.value.close()
      imageListLoadingInstance.value = null
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

/** 图片的点击事件 */
const handleImageButtonClick = async (type: string, imageDetail: ImageVO) => {
  // 详情
  if (type === 'more') {
    showImageDetailId.value = imageDetail.id
    await handleDetailOpen()
    return
  }
  // 删除
  if (type === 'delete') {
    await message.confirm(`是否删除照片?`)
    await ImageApi.deleteImageMy(imageDetail.id)
    await getImageList()
    message.success('删除成功!')
    return
  }
  // 下载
  if (type === 'download') {
    await download.image({ url: imageDetail.picUrl })
    return
  }
  // 重新生成
  if (type === 'regeneration') {
    await emits('onRegeneration', imageDetail)
    return
  }
}

/** 处理 Midjourney 按钮点击事件  */
const handleImageMidjourneyButtonClick = async (
  button: ImageMidjourneyButtonsVO,
  imageDetail: ImageVO
) => {
  // 1. 构建 params 参数
  const data = {
    id: imageDetail.id,
    customId: button.customId
  } as ImageMidjourneyActionVO
  // 2. 发送 action
  await ImageApi.midjourneyAction(data)
  // 3. 刷新列表
  await getImageList()
}

defineExpose({ getImageList }) // 暴露组件方法

const emits = defineEmits(['onRegeneration'])

/** 组件挂在的时候 */
onMounted(async () => {
  // 获取 image 列表
  await getImageList()
  // 自动刷新 image 列表
  inProgressTimer.value = setInterval(async () => {
    await refreshWatchImages()
  }, 1000 * 3)
})

/** 组件取消挂在的时候 */
onUnmounted(async () => {
  if (inProgressTimer.value) {
    clearInterval(inProgressTimer.value)
  }
})
</script>
<style lang="scss">
.dr-task {
  width: 100%;
  height: 100%;
}
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
  padding: 20px 20px 140px;
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
