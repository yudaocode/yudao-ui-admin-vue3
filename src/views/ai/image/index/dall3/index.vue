<!-- dall3 -->
<template>
  <div class="prompt">
    <el-text tag="b">画面描述</el-text>
    <el-text tag="p">建议使用“形容词+动词+风格”的格式，使用“，”隔开</el-text>
    <!-- TODO @fan：style 看看能不能哟 unocss 替代 @芋艿 尝试了下没效果，哪个地方有使用么，我看看  -->
    <el-input
      v-model="prompt"
      maxlength="1024"
      rows="5"
      style="width: 100%; margin-top: 15px;"
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
      <el-button round
                 class="btn"
                 :type="(selectHotWord === hotWord ? 'primary' : 'default')"
                 v-for="hotWord in hotWords"
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
        v-for="model in models"
        :key="model.key"

      >
        <el-image
          :src="model.image"
          fit="contain"
          @click="handleModelClick(model)"
        />
        <div class="model-font">{{model.name}}</div>
      </div>
    </el-space>
  </div>
  <div class="image-style">
    <div>
      <el-text tag="b">风格选择</el-text>
    </div>
    <el-space wrap class="image-style-list">
      <div
        :class="selectImageStyle === imageStyle.key ? 'image-style-item selectImageStyle' : 'image-style-item'"
        v-for="imageStyle in imageStyleList"
        :key="imageStyle.key"
      >
        <el-image
          :src="imageStyle.image"
          fit="contain"
          @click="handleStyleClick(imageStyle)"
        />
        <div class="style-font">{{imageStyle.name}}</div>
      </div>
    </el-space>
  </div>
  <div class="image-size">
    <div>
      <el-text tag="b">画面比例</el-text>
    </div>
    <el-space wrap class="size-list">
      <div class="size-item"
           v-for="imageSize in imageSizeList"
           :key="imageSize.key"
           @click="handleSizeClick(imageSize)">
        <div :class="selectImageSize === imageSize.key ? 'size-wrapper selectImageSize' : 'size-wrapper'">
          <div :style="imageSize.style"></div>
        </div>
        <div class="size-font">{{ imageSize.name }}</div>
      </div>
    </el-space>
  </div>
  <div class="btns">
    <el-button type="primary"
               size="large"
               round
               :loading="drawIn"
               @click="handleGenerateImage">
      {{drawIn ? '生成中' : '生成内容'}}
    </el-button>
  </div>
</template>
<script setup lang="ts">
import {ImageApi, ImageDrawReqVO, ImageVO} from '@/api/ai/image';

// image 模型
interface ImageModelVO {
  key: string
  name: string
  image: string
}

// image 大小
interface ImageSizeVO {
  key: string
  name: string,
  style: string,
  width: string,
  height: string,
}

// 定义属性
const prompt = ref<string>('')  // 提示词
const drawIn = ref<boolean>(false)  // 生成中
const selectHotWord = ref<string>('') // 选中的热词
const hotWords = ref<string[]>(['中国旗袍', '古装美女', '卡通头像', '机甲战士', '童话小屋', '中国长城'])  // 热词
const selectModel = ref<string>('dall-e-3') // 模型
// message
const message = useMessage()
const models = ref<ImageModelVO[]>([
  {
    key: 'dall-e-3',
    name: 'DALL·E 3',
    image: `/src/assets/ai/dall2.jpg`,
  },
  {
    key: 'dall-e-2',
    name: 'DALL·E 2',
    image: `/src/assets/ai/dall3.jpg`,
  },
])  // 模型

const selectImageStyle = ref<string>('vivid') // style 样式

const imageStyleList = ref<ImageModelVO[]>([
  {
    key: 'vivid',
    name: '清晰',
    image: `/src/assets/ai/qingxi.jpg`,
  },
  {
    key: 'natural',
    name: '自然',
    image: `/src/assets/ai/ziran.jpg`,
  },
])  // style

const selectImageSize = ref<string>('1024x1024') // 选中 size
const imageSizeList = ref<ImageSizeVO[]>([
  {
    key: '1024x1024',
    name: '1:1',
    width: '1024',
    height: '1024',
    style: 'width: 30px; height: 30px;background-color: #dcdcdc;',
  },
  {
    key: '1024x1792',
    name: '3:5',
    width: '1024',
    height: '1792',
    style: 'width: 30px; height: 50px;background-color: #dcdcdc;',
  },
  {
    key: '1792x1024',
    name: '5:3',
    width: '1792',
    height: '1024',
    style: 'width: 50px; height: 30px;background-color: #dcdcdc;',
  }
]) // size

// 定义 Props
const props = defineProps({})
// 定义 emits
const emits = defineEmits(['onDrawStart', 'onDrawComplete'])

/** 热词 - click  */
const handleHotWordClick = async (hotWord: string) => {
  // 取消选中
  if (selectHotWord.value == hotWord) {
    selectHotWord.value = ''
    return
  }
  // 选中
  selectHotWord.value = hotWord
  // 替换提示词
  prompt.value = hotWord
}

/**  模型 - click  */
const handleModelClick = async (model: ImageModelVO) => {
  selectModel.value = model.key
}

/**  样式 - click  */
const handleStyleClick = async (imageStyle: ImageModelVO) => {
  selectImageStyle.value = imageStyle.key
}

/**  size - click  */
const handleSizeClick = async (imageSize: ImageSizeVO) => {
  selectImageSize.value = imageSize.key
}

/**  图片生产  */
const handleGenerateImage = async () => {
  // 二次确认
  await message.confirm(`确认生成内容?`)
  try {
    // 加载中
    drawIn.value = true
    // 回调
    emits('onDrawStart', selectModel.value)
    const imageSize = imageSizeList.value.find(item => item.key === selectImageSize.value) as ImageSizeVO
    const form = {
      platform: 'OpenAI',
      prompt: prompt.value, // 提示词
      model: selectModel.value, // 模型
      width: imageSize.width, // size 不能为空
      height: imageSize.height, // size 不能为空
      options: {
        style: selectImageStyle.value, // 图像生成的风格
      }
    } as ImageDrawReqVO
    // 发送请求
    await ImageApi.drawImage(form)
  } finally {
    // 回调
    emits('onDrawComplete', selectModel.value)
    // 加载结束
    drawIn.value = false
  }
}

/** 填充值 */
const settingValues = async (imageDetail: ImageVO) => {
  prompt.value = imageDetail.prompt
  selectModel.value = imageDetail.model
  //
  selectImageStyle.value = imageDetail.options?.style
  //
  const imageSize = imageSizeList.value.find(item => item.key === `${imageDetail.width}x${imageDetail.height}`) as ImageSizeVO
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
