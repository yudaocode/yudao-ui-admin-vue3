<!-- dall3 -->
<template>
  <div class="prompt">
    <el-text tag="b">画面描述</el-text>
    <el-text tag="p">建议使用“形容词+动词+风格”的格式，使用“，”隔开</el-text>
    <!-- TODO @fan：style 看看能不能哟 unocss 替代 -->
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
                 @click="handlerHotWordClick(hotWord)"
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
        :class="selectModel === model ? 'modal-item selectModel' : 'modal-item'"
        v-for="model in models"
        :key="model.key"

      >
        <el-image
          :src="model.image"
          fit="contain"
          @click="handlerModelClick(model)"
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
        :class="selectImageStyle === imageStyle ? 'image-style-item selectImageStyle' : 'image-style-item'"
        v-for="imageStyle in imageStyleList"
        :key="imageStyle.key"
      >
        <el-image
          :src="imageStyle.image"
          fit="contain"
          @click="handlerStyleClick(imageStyle)"
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
           @click="handlerSizeClick(imageSize)">
        <div :class="selectImageSize === imageSize ? 'size-wrapper selectImageSize' : 'size-wrapper'">
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
               @click="handlerGenerateImage">
      {{drawIn ? '生成中' : '生成内容'}}
    </el-button>
  </div>
</template>
<script setup lang="ts">
import {ImageApi, ImageDrawReqVO} from '@/api/ai/image';

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
const selectModel = ref<any>({}) // 模型
// message
const message = useMessage()
// TODO @fan：image 改成项目里自己的哈
// TODO @fan：这个 image，要不看看网上有没合适的图片，作为占位符，啊哈哈
const models = ref<ImageModelVO[]>([
  {
    key: 'dall-e-3',
    name: 'DALL·E 3',
    image: 'https://h5.cxyhub.com/images/model_2.png',
  },
  {
    key: 'dall-e-2',
    name: 'DALL·E 2',
    image: 'https://h5.cxyhub.com/images/model_1.png',
  },
])  // 模型
selectModel.value = models.value[0]

const selectImageStyle = ref<any>({}) // style 样式
// TODO @fan：image 改成项目里自己的哈
const imageStyleList = ref<ImageModelVO[]>([
  {
    key: 'vivid',
    name: '清晰',
    image: 'https://h5.cxyhub.com/images/model_1.png',
  },
  {
    key: 'natural',
    name: '自然',
    image: 'https://h5.cxyhub.com/images/model_2.png',
  },
])  // style
selectImageStyle.value = imageStyleList.value[0]

const selectImageSize = ref<ImageSizeVO>({} as ImageSizeVO) // 选中 size
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
selectImageSize.value = imageSizeList.value[0]

// 定义 Props
const props = defineProps({})
// 定义 emits
const emits = defineEmits(['onDrawStart', 'onDrawComplete'])

// TODO @fan：如果是简单注释，建议用 /** */，主要是现在项目里是这种风格哈，保持一致好点~
// TODO @fan：handler 应该改成 handle 哈
/** 热词 - click  */
const handlerHotWordClick = async (hotWord: string) => {
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
const handlerModelClick = async (model: ImageModelVO) => {
  if (selectModel.value === model) {
    selectModel.value = {} as ImageModelVO
    return
  }
  selectModel.value = model
}

/**  样式 - click  */
const handlerStyleClick = async (imageStyle: ImageModelVO) => {
  if (selectImageStyle.value === imageStyle) {
    selectImageStyle.value = {} as ImageModelVO
    return
  }
  selectImageStyle.value = imageStyle
}

/**  size - click  */
const handlerSizeClick = async (imageSize: ImageSizeVO) => {
  if (selectImageSize.value === imageSize) {
    selectImageSize.value = {} as ImageSizeVO
    return
  }
  selectImageSize.value = imageSize
}

/**  图片生产  */
const handlerGenerateImage = async () => {
  // 二次确认
  await message.confirm(`确认生成内容?`)
  try {
    // 加载中
    drawIn.value = true
    // 回调
    emits('onDrawStart', selectModel.value.key)
    const form = {
      platform: 'OpenAI',
      prompt: prompt.value, // 提示词
      model: selectModel.value.key, // 模型
      width: selectImageSize.value.width, // size 不能为空
      height: selectImageSize.value.height, // size 不能为空
      options: {
        style: selectImageStyle.value.key, // 图像生成的风格
      }
    } as ImageDrawReqVO
    // 发送请求
    await ImageApi.drawImage(form)
  } finally {
    // 回调
    emits('onDrawComplete', selectModel.value.key)
    // 加载结束
    drawIn.value = false
  }
}

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
