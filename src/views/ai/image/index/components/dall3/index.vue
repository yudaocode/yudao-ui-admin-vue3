<!-- dall3 -->
<template>
  <div class="prompt">
    <el-text tag="b">画面描述</el-text>
    <el-text tag="p">建议使用"形容词 + 动词 + 风格"的格式，使用"，"隔开</el-text>
    <el-input
      v-model="prompt"
      maxlength="1024"
      :rows="5"
      class="w-100% mt-15px"
      input-style="border-radius: 7px;"
      placeholder="例如：童话里的小屋应该是什么样子？"
      show-word-limit
      type="textarea"
    />
  </div>
  <div class="flex flex-col mt-30px">
    <div>
      <el-text tag="b">随机热词</el-text>
    </div>
    <el-space wrap class="flex flex-row flex-wrap justify-start mt-15px">
      <el-button
        round
        class="m-0"
        :type="selectHotWord === hotWord ? 'primary' : 'default'"
        v-for="hotWord in ImageHotWords"
        :key="hotWord"
        @click="handleHotWordClick(hotWord)"
      >
        {{ hotWord }}
      </el-button>
    </el-space>
  </div>
  <div class="mt-30px">
    <div>
      <el-text tag="b">模型选择</el-text>
    </div>
    <el-space wrap class="mt-15px">
      <div
        :class="selectModel === model.key ? 'w-110px overflow-hidden flex flex-col items-center border-3 border-solid border-#1293ff rounded-5px cursor-pointer' : 'w-110px overflow-hidden flex flex-col items-center border-3 border-solid border-transparent cursor-pointer'"
        v-for="model in Dall3Models"
        :key="model.key"
      >
        <el-image :src="model.image" fit="contain" @click="handleModelClick(model)" />
        <div class="text-14px color-#3e3e3e font-bold">{{ model.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="mt-30px">
    <div>
      <el-text tag="b">风格选择</el-text>
    </div>
    <el-space wrap class="mt-15px">
      <div
        :class="style === imageStyle.key ? 'w-110px overflow-hidden flex flex-col items-center border-3 border-solid border-#1293ff rounded-5px cursor-pointer' : 'w-110px overflow-hidden flex flex-col items-center border-3 border-solid border-transparent cursor-pointer'"
        v-for="imageStyle in Dall3StyleList"
        :key="imageStyle.key"
      >
        <el-image :src="imageStyle.image" fit="contain" @click="handleStyleClick(imageStyle)" />
        <div class="text-14px color-#3e3e3e font-bold">{{ imageStyle.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="w-full mt-30px">
    <div>
      <el-text tag="b">画面比例</el-text>
    </div>
    <el-space wrap class="flex flex-row justify-between w-full mt-20px">
      <div
        class="flex flex-col items-center cursor-pointer"
        v-for="imageSize in Dall3SizeList"
        :key="imageSize.key"
        @click="handleSizeClick(imageSize)"
      >
        <div
          :class="selectSize === imageSize.key ? 'flex flex-col items-center justify-center rounded-7px p-4px w-50px h-50px bg-white border-1 border-solid border-#1293ff' : 'flex flex-col items-center justify-center rounded-7px p-4px w-50px h-50px bg-white border-1 border-solid border-white'"
        >
          <div :style="imageSize.style"></div>
        </div>
        <div class="text-14px color-#3e3e3e font-bold">{{ imageSize.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="flex justify-center mt-50px">
    <el-button
      type="primary"
      size="large"
      round
      :loading="drawIn"
      :disabled="prompt.length === 0"
      @click="handleGenerateImage"
    >
      {{ drawIn ? '生成中' : '生成内容' }}
    </el-button>
  </div>
</template>
<script setup lang="ts">
import { ImageApi, ImageDrawReqVO, ImageVO } from '@/api/ai/image'
import {
  Dall3Models,
  Dall3StyleList,
  ImageHotWords,
  Dall3SizeList,
  ImageModelVO,
  AiPlatformEnum,
  ImageSizeVO
} from '@/views/ai/utils/constants'
import { ModelVO } from '@/api/ai/model/model'

const message = useMessage() // 消息弹窗

// 接收父组件传入的模型列表
const props = defineProps({
  models: {
    type: Array<ModelVO>,
    default: () => [] as ModelVO[]
  }
})
const emits = defineEmits(['onDrawStart', 'onDrawComplete']) // 定义 emits

// 定义属性
const prompt = ref<string>('') // 提示词
const drawIn = ref<boolean>(false) // 生成中
const selectHotWord = ref<string>('') // 选中的热词
const selectModel = ref<string>('dall-e-3') // 模型
const selectSize = ref<string>('1024x1024') // 选中 size
const style = ref<string>('vivid') // style 样式

/** 选择热词 */
const handleHotWordClick = async (hotWord: string) => {
  // 情况一：取消选中
  if (selectHotWord.value == hotWord) {
    selectHotWord.value = ''
    return
  }

  // 情况二：选中
  selectHotWord.value = hotWord
  prompt.value = hotWord
}

/** 选择 model 模型 */
const handleModelClick = async (model: ImageModelVO) => {
  selectModel.value = model.key
  // 可以在这里添加模型特定的处理逻辑
  // 例如，如果未来需要根据不同模型设置不同参数
  if (model.key === 'dall-e-3') {
    // DALL-E-3 模型特定的处理
    style.value = 'vivid' // 默认设置vivid风格
  } else if (model.key === 'dall-e-2') {
    // DALL-E-2 模型特定的处理
    style.value = 'natural' // 如果有其他DALL-E-2适合的默认风格
  }

  // 更新其他相关参数
  // 例如可以默认选择最适合当前模型的尺寸
  const recommendedSize = Dall3SizeList.find(
    (size) =>
      (model.key === 'dall-e-3' && size.key === '1024x1024') ||
      (model.key === 'dall-e-2' && size.key === '512x512')
  )

  if (recommendedSize) {
    selectSize.value = recommendedSize.key
  }
}

/** 选择 style 样式  */
const handleStyleClick = async (imageStyle: ImageModelVO) => {
  style.value = imageStyle.key
}

/** 选择 size 大小  */
const handleSizeClick = async (imageSize: ImageSizeVO) => {
  selectSize.value = imageSize.key
}

/**  图片生产  */
const handleGenerateImage = async () => {
  // 从 models 中查找匹配的模型
  const matchedModel = props.models.find(
    (item) => item.model === selectModel.value && item.platform === AiPlatformEnum.OPENAI
  )
  if (!matchedModel) {
    message.error('该模型不可用，请选择其它模型')
    return
  }

  // 二次确认
  await message.confirm(`确认生成内容?`)
  try {
    // 加载中
    drawIn.value = true
    // 回调
    emits('onDrawStart', AiPlatformEnum.OPENAI)
    const imageSize = Dall3SizeList.find((item) => item.key === selectSize.value) as ImageSizeVO
    const form = {
      platform: AiPlatformEnum.OPENAI,
      prompt: prompt.value, // 提示词
      modelId: matchedModel.id, // 使用匹配到的模型
      style: style.value, // 图像生成的风格
      width: imageSize.width, // size 不能为空
      height: imageSize.height, // size 不能为空
      options: {
        style: style.value // 图像生成的风格
      }
    } as ImageDrawReqVO
    // 发送请求
    await ImageApi.drawImage(form)
  } finally {
    // 回调
    emits('onDrawComplete', AiPlatformEnum.OPENAI)
    // 加载结束
    drawIn.value = false
  }
}

/** 填充值 */
const settingValues = async (detail: ImageVO) => {
  prompt.value = detail.prompt
  selectModel.value = detail.model
  style.value = detail.options?.style
  const imageSize = Dall3SizeList.find(
    (item) => item.key === `${detail.width}x${detail.height}`
  ) as ImageSizeVO
  await handleSizeClick(imageSize)
}

/** 暴露组件方法 */
defineExpose({ settingValues })
</script>

