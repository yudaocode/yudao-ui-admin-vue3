<!-- dall3 -->
<template>
  <div class="prompt">
    <el-text tag="b">画面描述</el-text>
    <el-text tag="p">建议使用“形容词+动词+风格”的格式，使用“，”隔开.</el-text>
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
  <div class="w-full mt-30px">
    <div>
      <el-text tag="b">尺寸</el-text>
    </div>
    <el-space wrap class="flex flex-row justify-between w-full mt-20px">
      <div
        class="flex flex-col items-center cursor-pointer"
        v-for="imageSize in MidjourneySizeList"
        :key="imageSize.key"
        @click="handleSizeClick(imageSize)"
      >
        <div
          :class="selectSize === imageSize.key ? 'flex flex-col items-center justify-center rounded-7px p-4px w-50px h-50px bg-white border-1 border-solid border-#1293ff' : 'flex flex-col items-center justify-center rounded-7px p-4px w-50px h-50px bg-white border-1 border-solid border-white'"
        >
          <div :style="imageSize.style"></div>
        </div>
        <div class="text-14px color-#3e3e3e font-bold">{{ imageSize.key }}</div>
      </div>
    </el-space>
  </div>
  <div class="mt-30px">
    <div>
      <el-text tag="b">模型</el-text>
    </div>
    <el-space wrap class="mt-15px">
      <div
        :class="selectModel === model.key ? 'flex flex-col items-center w-150px overflow-hidden border-3 border-solid border-#1293ff rounded-5px cursor-pointer' : 'flex flex-col items-center w-150px overflow-hidden border-3 border-solid border-transparent cursor-pointer'"
        v-for="model in MidjourneyModels"
        :key="model.key"
      >
        <el-image :src="model.image" fit="contain" @click="handleModelClick(model)" />
        <div class="text-14px color-#3e3e3e font-bold">{{ model.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="mt-20px">
    <div>
      <el-text tag="b">版本</el-text>
    </div>
    <el-space wrap class="mt-20px w-full">
      <el-select
        v-model="selectVersion"
        class="!w-350px"
        clearable
        placeholder="请选择版本"
      >
        <el-option
          v-for="item in versionList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-space>
  </div>
  <div class="mt-30px">
    <div>
      <el-text tag="b">参考图</el-text>
    </div>
    <el-space wrap class="mt-15px">
      <UploadImg v-model="referImageUrl" height="120px" width="120px" />
    </el-space>
  </div>
  <div class="flex justify-center mt-50px">
    <el-button
      type="primary"
      size="large"
      round
      :disabled="prompt.length === 0"
      @click="handleGenerateImage"
    >
      {{ drawIn ? '生成中' : '生成内容' }}
    </el-button>
  </div>
</template>
<script setup lang="ts">
import { ImageApi, ImageMidjourneyImagineReqVO, ImageVO } from '@/api/ai/image'
import {
  AiPlatformEnum,
  ImageHotWords,
  ImageSizeVO,
  ImageModelVO,
  MidjourneyModels,
  MidjourneySizeList,
  MidjourneyVersions,
  NijiVersionList
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
const drawIn = ref<boolean>(false) // 生成中
const selectHotWord = ref<string>('') // 选中的热词
// 表单
const prompt = ref<string>('') // 提示词
const referImageUrl = ref<any>() // 参考图
const selectModel = ref<string>('midjourney') // 选中的模型
const selectSize = ref<string>('1:1') // 选中 size
const selectVersion = ref<any>('6.0') // 选中的 version
const versionList = ref<any>(MidjourneyVersions) // version 列表

/** 选择热词 */
const handleHotWordClick = async (hotWord: string) => {
  // 情况一：取消选中
  if (selectHotWord.value == hotWord) {
    selectHotWord.value = ''
    return
  }

  // 情况二：选中
  selectHotWord.value = hotWord // 选中
  prompt.value = hotWord // 设置提示次
}

/** 点击 size 尺寸 */
const handleSizeClick = async (imageSize: ImageSizeVO) => {
  selectSize.value = imageSize.key
}

/** 点击 model 模型 */
const handleModelClick = async (model: ImageModelVO) => {
  selectModel.value = model.key
  if (model.key === 'niji') {
    versionList.value = NijiVersionList // 默认选择 niji
  } else {
    versionList.value = MidjourneyVersions // 默认选择 midjourney
  }
  selectVersion.value = versionList.value[0].value
}

/** 图片生成 */
const handleGenerateImage = async () => {
  // 从 models 中查找匹配的模型
  const matchedModel = props.models.find(
    (item) => item.model === selectModel.value && item.platform === AiPlatformEnum.MIDJOURNEY
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
    emits('onDrawStart', AiPlatformEnum.MIDJOURNEY)
    // 发送请求
    const imageSize = MidjourneySizeList.find(
      (item) => selectSize.value === item.key
    ) as ImageSizeVO
    const req = {
      prompt: prompt.value,
      modelId: matchedModel.id,
      width: imageSize.width,
      height: imageSize.height,
      version: selectVersion.value,
      referImageUrl: referImageUrl.value
    } as ImageMidjourneyImagineReqVO
    await ImageApi.midjourneyImagine(req)
  } finally {
    // 回调
    emits('onDrawComplete', AiPlatformEnum.MIDJOURNEY)
    // 加载结束
    drawIn.value = false
  }
}

/** 填充值 */
const settingValues = async (detail: ImageVO) => {
  // 提示词
  prompt.value = detail.prompt
  // image size
  const imageSize = MidjourneySizeList.find(
    (item) => item.key === `${detail.width}:${detail.height}`
  ) as ImageSizeVO
  selectSize.value = imageSize.key
  // 选中模型
  const model = MidjourneyModels.find((item) => item.key === detail.options?.model) as ImageModelVO
  await handleModelClick(model)
  // 版本
  selectVersion.value = versionList.value.find(
    (item) => item.value === detail.options?.version
  ).value
  // image
  referImageUrl.value = detail.options.referImageUrl
}

/** 暴露组件方法 */
defineExpose({ settingValues })
</script>

