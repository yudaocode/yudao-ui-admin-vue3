<!-- image -->
<template>
  <div class="ai-image">
    <div class="left">
      <div class="segmented">
        <el-segmented v-model="selectPlatform" :options="platformOptions" />
      </div>
      <div class="modal-switch-container">
        <Dall3
          v-if="selectPlatform === AiPlatformEnum.OPENAI"
          ref="dall3Ref"
          @on-draw-start="handlerDrawStart"
          @on-draw-complete="handlerDrawComplete"
        />
        <Midjourney
          v-if="selectPlatform === AiPlatformEnum.MIDJOURNEY"
          ref="midjourneyRef"
        />
        <StableDiffusion
          v-if="selectPlatform === AiPlatformEnum.STABLE_DIFFUSION"
          ref="stableDiffusionRef"
          @on-draw-complete="handlerDrawComplete"
        />
      </div>
    </div>
    <div class="main">
      <ImageTask ref="imageTaskRef" @on-regeneration="handlerRegeneration" />
    </div>
  </div>
</template>

<script setup lang="ts">
// TODO @fan：在整个挪到 /views/ai/image/index 目录。因为我想在 /views/ai/image/manager 做管理的功能，进行下区分！
import Dall3 from './dall3/index.vue'
import Midjourney from './midjourney/index.vue'
import StableDiffusion from './stable-diffusion/index.vue'
import ImageTask from './ImageTask.vue'
import { AiPlatformEnum } from '@/views/ai/utils/constants'
import {ImageVO} from "@/api/ai/image";


const imageTaskRef = ref<any>() // image task ref
const dall3Ref = ref<any>() // image task ref
const midjourneyRef = ref<any>() // image task ref
const stableDiffusionRef = ref<any>() // image task ref

// 定义属性
const selectPlatform = ref('StableDiffusion')
const platformOptions = [
  {
    label: 'DALL3 绘画',
    value: AiPlatformEnum.OPENAI
  },
  {
    label: 'MJ 绘画',
    value: AiPlatformEnum.MIDJOURNEY
  },
  {
    label: 'Stable Diffusion',
    value: AiPlatformEnum.STABLE_DIFFUSION
  }
]
const drawIn = ref<boolean>(false) // 生成中

/**  绘画 - start  */
const handlerDrawStart = async (type) => {
  // todo @fan：这个是不是没用啦？
  drawIn.value = true
}

/**  绘画 - complete  */
const handlerDrawComplete = async (type) => {
  drawIn.value = false
  // todo
  await imageTaskRef.value.getImageList()
}

/**  绘画 - 重新生成  */
const handlerRegeneration = async (imageDetail: ImageVO) => {
  // 切换平台
  selectPlatform.value = imageDetail.platform

  // 根据不同平台填充 imageDetail
  if (imageDetail.platform === AiPlatformEnum.MIDJOURNEY) {
    await nextTick(async () => {
      midjourneyRef.value.settingValues(imageDetail)
    })
  } else if (imageDetail.platform === AiPlatformEnum.OPENAI) {
    await nextTick(async () => {
      dall3Ref.value.settingValues(imageDetail)
    })
  } else if (imageDetail.platform === AiPlatformEnum.STABLE_DIFFUSION) {
    await nextTick(async () => {
      stableDiffusionRef.value.settingValues(imageDetail)
    })
  }

}
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
    width: 350px;

    .segmented {
    }

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
