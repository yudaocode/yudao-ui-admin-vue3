<!-- dall3 -->
<template>
  <div class="prompt">
    <el-text tag="b">画面描述</el-text>
    <el-text tag="p">建议使用“形容词+动词+风格”的格式，使用“，”隔开.</el-text>
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
  <div class="image-size">
    <div>
      <el-text tag="b">尺寸</el-text>
    </div>
    <el-space wrap class="size-list">
      <div class="size-item"
           v-for="imageSize in imageSizeList"
           :key="imageSize.key"
           @click="handlerSizeClick(imageSize)">
        <div :class="selectImageSize === imageSize ? 'size-wrapper selectImageSize' : 'size-wrapper'">
          <div :style="imageSize.style"></div>
        </div>
        <div class="size-font">{{ imageSize.key }}</div>
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
        class="version-select"
        clearable
        placeholder="请选择版本"
        style="width: 350px"
        @change="handlerChangeVersion"
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
      <el-text tag="b">模型</el-text>
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
  <div class="model">
    <div>
      <el-text tag="b">参考图</el-text>
    </div>
    <el-space wrap class="model-list">
      <UploadImg v-model="referImage" height="80px" width="80px" />
    </el-space>
  </div>
  <div class="btns">
    <!--    <el-button size="large" round>重置内容</el-button>-->
    <el-button type="primary" size="large" round @click="handlerGenerateImage">生成内容</el-button>
  </div>
</template>
<script setup lang="ts">

// image 模型
import {ImageApi, ImageMidjourneyImagineReqVO} from "@/api/ai/image";
// message
const message = useMessage()
// 定义 emits
const emits = defineEmits(['onDrawStart', 'onDrawComplete'])

interface ImageModelVO {
  key: string
  name: string
  image: string
}

// image 大小
interface ImageSizeVO {
  key: string
  style: string,
  width: string,
  height: string,
}

// 定义属性
const prompt = ref<string>('')  // 提示词
const referImage = ref<any>()  // 参考图
const selectHotWord = ref<string>('') // 选中的热词
const hotWords = ref<string[]>(['中国旗袍', '古装美女', '卡通头像', '机甲战士', '童话小屋', '中国长城'])  // 热词
const selectModel = ref<any>() // 选中的热词
const models = ref<ImageModelVO[]>([
  {
    key: 'midjourney',
    name: 'MJ',
    image: 'https://bigpt8.com/pc/_nuxt/mj.34a61377.png',
  },
  {
    key: 'niji',
    name: 'NIJI',
    image: 'https://bigpt8.com/pc/_nuxt/nj.ca79b143.png',
  },
])  // 模型
selectModel.value = models.value[0] // 默认选中

const selectImageSize = ref<ImageSizeVO>({} as ImageSizeVO) // 选中 size
const imageSizeList = ref<ImageSizeVO[]>([
  {
    key: '1:1',
    width: "1",
    height: "1",
    style: 'width: 30px; height: 30px;background-color: #dcdcdc;',
  },
  {
    key: '3:4',
    width: "3",
    height: "4",
    style: 'width: 30px; height: 40px;background-color: #dcdcdc;',
  },
  {
    key: '4:3',
    width: "4",
    height: "3",
    style: 'width: 40px; height: 30px;background-color: #dcdcdc;',
  },
  {
    key: '9:16',
    width: "9",
    height: "16",
    style: 'width: 30px; height: 50px;background-color: #dcdcdc;',
  },
  {
    key: '16:9',
    width: "16",
    height: "9",
    style: 'width: 50px; height: 30px;background-color: #dcdcdc;',
  },
]) // size
selectImageSize.value = imageSizeList.value[0]

// version
let versionList = ref<any>([]) // version 列表
const midjourneyVersionList = ref<any>([
  {
    value: '6.0',
    label: 'v6.0',
  },
  {
    value: '5.2',
    label: 'v5.2',
  },
  {
    value: '5.1',
    label: 'v5.1',
  },
  {
    value: '5.0',
    label: 'v5.0',
  },
  {
    value: '4.0',
    label: 'v4.0',
  },
])
const nijiVersionList = ref<any>([
  {
    value: '5',
    label: 'v5',
  },
])
const selectVersion = ref<any>('6.0') // 选中的 version
versionList.value = midjourneyVersionList.value // 默认选择 midjourney

/**  热词 - click  */
const handlerHotWordClick = async (hotWord: string) => {
  // 取消
  if (selectHotWord.value == hotWord) {
    selectHotWord.value = ''
    return
  }
  // 选中
  selectHotWord.value = hotWord
  // 设置提示次
  prompt.value = hotWord
}

/**  size - click  */
const handlerSizeClick = async (imageSize: ImageSizeVO) => {
  if (selectImageSize.value === imageSize) {
    selectImageSize.value = {} as ImageSizeVO
    return
  }
  selectImageSize.value = imageSize
}

/**  模型 - click  */
const handlerModelClick = async (model: ImageModelVO) => {
  selectModel.value = model
  if (model.key === 'niji') {
    versionList.value = nijiVersionList.value // 默认选择 niji
  } else {
    versionList.value = midjourneyVersionList.value // 默认选择 midjourney
  }
  selectVersion.value = versionList.value[0].value
}

/**  version - click  */
const handlerChangeVersion = async (version) => {
  console.log('version', version)
}

/** 图片生产  */
const handlerGenerateImage = async () => {
  // 二次确认
  await message.confirm(`确认生成内容?`)
  // todo @范 图片生产逻辑
  try {
    console.log('referImage.value', referImage.value)
    // 回调
    emits('onDrawStart', selectModel.value.key)
    // 发送请求
    const req = {
      prompt: prompt.value,
      model: selectModel.value.key,
      width: selectImageSize.value.width,
      height: selectImageSize.value.height,
      version: selectVersion.value,
      referImageUrl: referImage.value,
    } as ImageMidjourneyImagineReqVO
    await ImageApi.midjourneyImagine(req)
  } finally {
    // 回调
    emits('onDrawComplete', selectModel.value.key)
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
