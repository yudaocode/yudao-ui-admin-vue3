<!-- dall3 -->
<template>
  <div class="prompt">
    <el-text tag="b">画面描述</el-text>
    <el-text tag="p">建议使用“形容词+动词+风格”的格式，使用“，”隔开.</el-text>
    <el-input
      v-model="prompt"
      maxlength="1024"
      rows="5"
      class="w-100% mt-15px"
      input-style="border-radius: 7px;"
      placeholder="例如：童话里的小屋应该是什么样子？"
      show-word-limit
      type="textarea"
    />
  </div>
  <div class="hot-words">
    <div>
      <el-text tag="b">随机热词</el-text>
    </div>
    <el-space wrap class="word-list">
      <el-button
        round
        class="btn"
        :type="selectHotWord === hotWord ? 'primary' : 'default'"
        v-for="hotWord in ImageHotWords"
        :key="hotWord"
        @click="handleHotWordClick(hotWord)"
      >
        {{ hotWord }}
      </el-button>
    </el-space>
  </div>
  <div class="image-size">
    <div>
      <el-text tag="b">尺寸</el-text>
    </div>
    <el-space wrap class="size-list">
      <div
        class="size-item"
        v-for="imageSize in MidjourneySizeList"
        :key="imageSize.key"
        @click="handleSizeClick(imageSize)"
      >
        <div
          :class="selectSize === imageSize.key ? 'size-wrapper selectImageSize' : 'size-wrapper'"
        >
          <div :style="imageSize.style"></div>
        </div>
        <div class="size-font">{{ imageSize.key }}</div>
      </div>
    </el-space>
  </div>
  <div class="model">
    <div>
      <el-text tag="b">模型</el-text>
    </div>
    <el-space wrap class="model-list">
      <div
        :class="selectModel === model.key ? 'modal-item selectModel' : 'modal-item'"
        v-for="model in MidjourneyModels"
        :key="model.key"
      >
        <el-image :src="model.image" fit="contain" @click="handleModelClick(model)" />
        <div class="model-font">{{ model.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="version">
    <div>
      <el-text tag="b">版本</el-text>
    </div>
    <el-space wrap class="version-list">
      <el-select
        v-model="selectVersion"
        class="version-select !w-350px"
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
  <div class="model">
    <div>
      <el-text tag="b">参考图</el-text>
    </div>
    <el-space wrap class="model-list">
      <UploadImg v-model="referImageUrl" height="120px" width="120px" />
    </el-space>
  </div>
  <div class="btns">
    <el-button type="primary" size="large" round @click="handleGenerateImage">
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

const message = useMessage() // 消息弹窗

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
const emits = defineEmits(['onDrawStart', 'onDrawComplete']) // 定义 emits

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
      model: selectModel.value,
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
<style scoped lang="scss">
// 提示词
.prompt {
}

// 热词
.hot-words {
  display: flex;
  flex-direction: column;
  margin-top: 30px;

  .word-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: start;
    margin-top: 15px;

    .btn {
      margin: 0;
    }
  }
}

// version
.version {
  margin-top: 20px;

  .version-list {
    margin-top: 20px;
    width: 100%;
  }
}

// 模型
.model {
  margin-top: 30px;

  .model-list {
    margin-top: 15px;

    .modal-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 150px;
      //outline: 1px solid blue;
      overflow: hidden;
      border: 3px solid transparent;
      cursor: pointer;

      .model-font {
        font-size: 14px;
        color: #3e3e3e;
        font-weight: bold;
      }
    }

    .selectModel {
      border: 3px solid #1293ff;
      border-radius: 5px;
    }
  }
}

// 尺寸
.image-size {
  width: 100%;
  margin-top: 30px;

  .size-list {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    margin-top: 20px;

    .size-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;

      .size-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 7px;
        padding: 4px;
        width: 50px;
        height: 50px;
        background-color: #fff;
        border: 1px solid #fff;
      }

      .size-font {
        font-size: 14px;
        color: #3e3e3e;
        font-weight: bold;
      }
    }
  }

  .selectImageSize {
    border: 1px solid #1293ff !important;
  }
}

.btns {
  display: flex;
  justify-content: center;
  margin-top: 50px;
}
</style>
