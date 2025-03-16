<!-- image -->
<template>
  <div class="ai-image">
    <div class="left">
      <div class="segmented">
        <el-segmented v-model="selectPlatform" :options="platformOptions" />
      </div>
      <div class="modal-switch-container">
        <Common
          v-if="selectPlatform === 'common'"
          ref="commonRef"
          :models="models"
          @on-draw-complete="handleDrawComplete"
        />
        <Dall3
          v-if="selectPlatform === AiPlatformEnum.OPENAI"
          ref="dall3Ref"
          :models="models"
          @on-draw-start="handleDrawStart"
          @on-draw-complete="handleDrawComplete"
        />
        <Midjourney
          v-if="selectPlatform === AiPlatformEnum.MIDJOURNEY"
          ref="midjourneyRef"
          :models="models"
        />
        <StableDiffusion
          v-if="selectPlatform === AiPlatformEnum.STABLE_DIFFUSION"
          ref="stableDiffusionRef"
          :models="models"
          @on-draw-complete="handleDrawComplete"
        />
      </div>
    </div>
    <div class="main">
      <ImageList ref="imageListRef" @on-regeneration="handleRegeneration" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ImageList from './components/ImageList.vue'
import { AiPlatformEnum } from '@/views/ai/utils/constants'
import { ImageVO } from '@/api/ai/image'
import Dall3 from './components/dall3/index.vue'
import Midjourney from './components/midjourney/index.vue'
import StableDiffusion from './components/stableDiffusion/index.vue'
import Common from './components/common/index.vue'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { AiModelTypeEnum } from '@/views/ai/utils/constants'

const imageListRef = ref<any>() // image 列表 ref
const dall3Ref = ref<any>() // dall3(openai) ref
const midjourneyRef = ref<any>() // midjourney ref
const stableDiffusionRef = ref<any>() // stable diffusion ref
const commonRef = ref<any>() // stable diffusion ref

// 定义属性
const selectPlatform = ref('common') // 选中的平台
const platformOptions = [
  {
    label: '通用',
    value: 'common'
  },
  {
    label: 'DALL3 绘画',
    value: AiPlatformEnum.OPENAI
  },
  {
    label: 'MJ 绘画',
    value: AiPlatformEnum.MIDJOURNEY
  },
  {
    label: 'SD 绘图',
    value: AiPlatformEnum.STABLE_DIFFUSION
  }
]

const models = ref<ModelVO[]>([]) // 模型列表

/** 绘画 start  */
const handleDrawStart = async (platform: string) => {}

/** 绘画 complete */
const handleDrawComplete = async (platform: string) => {
  await imageListRef.value.getImageList()
}

/** 重新生成：将画图详情填充到对应平台 */
const handleRegeneration = async (image: ImageVO) => {
  // 切换平台
  selectPlatform.value = image.platform
  // 根据不同平台填充 image
  await nextTick()
  if (image.platform === AiPlatformEnum.MIDJOURNEY) {
    midjourneyRef.value.settingValues(image)
  } else if (image.platform === AiPlatformEnum.OPENAI) {
    dall3Ref.value.settingValues(image)
  } else if (image.platform === AiPlatformEnum.STABLE_DIFFUSION) {
    stableDiffusionRef.value.settingValues(image)
  }
  // TODO @fan：貌似 other 重新设置不行？
}

/** 组件挂载的时候 */
onMounted(async () => {
  // 获取模型列表
  models.value = await ModelApi.getModelSimpleList(AiModelTypeEnum.IMAGE)
})
</script>

<style scoped lang="scss">
.ai-image {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;

  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;

  .left {
    display: flex;
    flex-direction: column;
    padding: 20px;
    width: 390px;

    .segmented .el-segmented {
      --el-border-radius-base: 16px;
      --el-segmented-item-selected-color: #fff;
      background-color: #ececec;
      width: 350px;
    }

    .modal-switch-container {
      height: 100%;
      overflow-y: auto;
      margin-top: 30px;
    }
  }

  .main {
    flex: 1;
    background-color: #fff;
  }

  .right {
    width: 350px;
    background-color: #f7f8fa;
  }
}
</style>
