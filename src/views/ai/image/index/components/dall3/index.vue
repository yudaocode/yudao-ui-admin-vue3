<!-- dall3 -->
<template>
  <div class="prompt">
    <el-text tag="b">画面描述</el-text>
    <el-text tag="p">建议使用“形容词+动词+风格”的格式，使用“，”隔开</el-text>
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
  <div class="model">
    <div>
      <el-text tag="b">模型选择</el-text>
    </div>
    <el-space wrap class="model-list">
      <div
        :class="selectModel === model.key ? 'modal-item selectModel' : 'modal-item'"
        v-for="model in Dall3Models"
        :key="model.key"
      >
        <el-image :src="model.image" fit="contain" @click="handleModelClick(model)" />
        <div class="model-font">{{ model.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="image-style">
    <div>
      <el-text tag="b">风格选择</el-text>
    </div>
    <el-space wrap class="image-style-list">
      <div
        :class="style === imageStyle.key ? 'image-style-item selectImageStyle' : 'image-style-item'"
        v-for="imageStyle in Dall3StyleList"
        :key="imageStyle.key"
      >
        <el-image :src="imageStyle.image" fit="contain" @click="handleStyleClick(imageStyle)" />
        <div class="style-font">{{ imageStyle.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="image-size">
    <div>
      <el-text tag="b">画面比例</el-text>
    </div>
    <el-space wrap class="size-list">
      <div
        class="size-item"
        v-for="imageSize in Dall3SizeList"
        :key="imageSize.key"
        @click="handleSizeClick(imageSize)"
      >
        <div
          :class="selectSize === imageSize.key ? 'size-wrapper selectImageSize' : 'size-wrapper'"
        >
          <div :style="imageSize.style"></div>
        </div>
        <div class="size-font">{{ imageSize.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="btns">
    <el-button type="primary" size="large" round :loading="drawIn" @click="handleGenerateImage">
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
  AiPlatformEnum
} from '@/views/ai/utils/constants'

const message = useMessage() // 消息弹窗

// 定义属性
const prompt = ref<string>('') // 提示词
const drawIn = ref<boolean>(false) // 生成中
const selectHotWord = ref<string>('') // 选中的热词
const selectModel = ref<string>('dall-e-3') // 模型
const selectSize = ref<string>('1024x1024') // 选中 size
const style = ref<string>('vivid') // style 样式

const emits = defineEmits(['onDrawStart', 'onDrawComplete']) // 定义 emits

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
      model: selectModel.value, // 模型
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

// 模型
.model {
  margin-top: 30px;

  .model-list {
    margin-top: 15px;

    .modal-item {
      width: 110px;
      //outline: 1px solid blue;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
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

// 样式 style
.image-style {
  margin-top: 30px;

  .image-style-list {
    margin-top: 15px;

    .image-style-item {
      width: 110px;
      //outline: 1px solid blue;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 3px solid transparent;
      cursor: pointer;

      .style-font {
        font-size: 14px;
        color: #3e3e3e;
        font-weight: bold;
      }
    }

    .selectImageStyle {
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
