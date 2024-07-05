<template>
  <el-card body-class="" class="image-card">
    <div class="image-operation">
      <div>
        <el-button
          type="primary"
          text
          bg
          v-if="imageDetail?.status === AiImageStatusEnum.IN_PROGRESS"
        >
          生成中
        </el-button>
        <el-button text bg v-else-if="imageDetail?.status === AiImageStatusEnum.SUCCESS">
          已完成
        </el-button>
        <el-button type="danger" text bg v-else-if="imageDetail?.status === AiImageStatusEnum.FAIL">
          异常
        </el-button>
      </div>
      <div>
        <el-button
          class="btn"
          text
          :icon="Download"
          @click="handleBtnClick('download', imageDetail)"
        />
        <el-button
          class="btn"
          text
          :icon="RefreshRight"
          @click="handleBtnClick('regeneration', imageDetail)"
        />
        <el-button
          class="btn"
          text
          :icon="Delete"
          @click="handleBtnClick('delete', imageDetail)"
        />
        <el-button class="btn" text :icon="More" @click="handleBtnClick('more', imageDetail)" />
      </div>
    </div>
    <div class="image-wrapper" ref="cardImageRef">
      <!-- TODO @fan：要不加个点击，大图预览？ -->
      <img class="image" :src="imageDetail?.picUrl" />
      <div v-if="imageDetail?.status === AiImageStatusEnum.FAIL">
        {{ imageDetail?.errorMessage }}
      </div>
    </div>
    <!-- TODO @fan：style 使用 unocss 替代下 -->
    <div class="image-mj-btns">
      <el-button
        size="small"
        v-for="button in imageDetail?.buttons"
        :key="button"
        style="min-width: 40px; margin-left: 0; margin-right: 10px; margin-top: 5px"
        @click="handleMjBtnClick(button)"
      >
        {{ button.label }}{{ button.emoji }}
      </el-button>
    </div>
  </el-card>
</template>
<script setup lang="ts">
import {Delete, Download, More, RefreshRight} from '@element-plus/icons-vue'
import { ImageVO, ImageMjButtonsVO } from '@/api/ai/image'
import { PropType } from 'vue'
import { ElLoading } from 'element-plus'
import { AiImageStatusEnum } from '@/views/ai/utils/constants'

const cardImageRef = ref<any>() // 卡片 image ref
const cardImageLoadingInstance = ref<any>() // 卡片 image ref
const message = useMessage()
const props = defineProps({
  imageDetail: {
    type: Object as PropType<ImageVO>,
    require: true
  }
})

/**  按钮 - 点击事件  */
const handleBtnClick = async (type, imageDetail: ImageVO) => {
  emits('onBtnClick', type, imageDetail)
}

const handleLoading = async (status: number) => {
  // TODO @fan：这个搞成 Loading 组件，然后通过数据驱动，这样搞可以哇？
  if (status === AiImageStatusEnum.IN_PROGRESS) {
    cardImageLoadingInstance.value = ElLoading.service({
      target: cardImageRef.value,
      text: '生成中...'
    })
  } else {
    if (cardImageLoadingInstance.value) {
      cardImageLoadingInstance.value.close()
      cardImageLoadingInstance.value = null
    }
  }
}

/**  mj 按钮 click  */
const handleMjBtnClick = async (button: ImageMjButtonsVO) => {
  // 确认窗体
  await message.confirm(`确认操作 "${button.label} ${button.emoji}" ?`)
  emits('onMjBtnClick', button, props.imageDetail)
}

// watch
const { imageDetail } = toRefs(props)
watch(imageDetail, async (newVal, oldVal) => {
  await handleLoading(newVal.status as string)
})

// emits
const emits = defineEmits(['onBtnClick', 'onMjBtnClick'])

//
onMounted(async () => {
  await handleLoading(props.imageDetail.status as string)
})
</script>

<style scoped lang="scss">
.image-card {
  width: 320px;
  height: auto;
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;

  .image-operation {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .btn {
      //border: 1px solid red;
      padding: 10px;
      margin: 0;
    }
  }

  .image-wrapper {
    overflow: hidden;
    margin-top: 20px;
    height: 280px;
    flex: 1;

    .image {
      width: 100%;
      border-radius: 10px;
    }
  }

  .image-mj-btns {
    margin-top: 5px;
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
