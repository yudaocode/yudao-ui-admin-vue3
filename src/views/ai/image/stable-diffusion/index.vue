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
  <div class="group-item">
    <div>
      <el-text tag="b">采样</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-select
        v-model="selectSampler"
        placeholder="Select"
        size="large"
        style="width: 350px;"
      >
        <el-option
          v-for="item in sampler"
          :key="item.key"
          :label="item.name"
          :value="item.key"
        />
      </el-select>
    </el-space>
  </div>

  <div class="group-item">
    <div>
      <el-text tag="b">图片尺寸</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-select
        v-model="selectImageSize"
        placeholder="Select"
        size="large"
        style="width: 350px;"
      >
        <el-option
          v-for="item in imageSizeList"
          :key="item.key"
          :label="item.key"
          :value="item.key"
        />
      </el-select>
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">迭代步数</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-input v-model="steps" type="number" size="large" style="width: 350px" placeholder="Please input" />
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">随机性</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-input v-model="seed" type="number" size="large" style="width: 350px" placeholder="Please input" />
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
}

// image 大小
interface ImageSizeVO {
  key: string
  width: string,
  height: string,
}

// 定义属性
const prompt = ref<string>('')  // 提示词
const drawIn = ref<boolean>(false)  // 生成中
const selectHotWord = ref<string>('') // 选中的热词
const hotWords = ref<string[]>(['中国旗袍', '古装美女', '卡通头像', '机甲战士', '童话小屋', '中国长城'])  // 热词
const selectSampler = ref<any>({}) // 模型
// message
const message = useMessage()
// 模型
const sampler = ref<ImageModelVO[]>([
  {
    key: 'Euler a',
    name: 'Euler a',
  },
  {
    key: 'DPM++ 2S a Karras',
    name: 'DPM++ 2S a Karras',
  },
  {
    key: 'DPM++ 2M Karras',
    name: 'DPM++ 2M Karras',
  },
  {
    key: 'DPM++ SDE Karras',
    name: 'DPM++ SDE Karras',
  },
  {
    key: 'DPM++ 2M SDE Karras',
    name: 'DPM++ 2M SDE Karras',
  },
])  // 模型
selectSampler.value = sampler.value[0]


const selectImageSize = ref<ImageSizeVO>({} as ImageSizeVO) // 选中 size
const imageSizeList = ref<ImageSizeVO[]>([
  {
    key: '512x512',
    width: '512',
    height: '512',
  },
  {
    key: '1024x1024',
    width: '1024',
    height: '1024',
  },
  {
    key: '1024x1792',
    width: '1024',
    height: '1792',
  },
  {
    key: '1792x1024',
    width: '1792',
    height: '1024',
  },
  {
    key: '2048x2048',
    width: '2048',
    height: '2048',
  },
  {
    key: '720x1280',
    width: '720',
    height: '1280',
  },
  {
    key: '1080x1920',
    width: '1080',
    height: '1920',
  },
  {
    key: '1440x2560',
    width: '1440',
    height: '2560',
  },
  {
    key: '2160x3840',
    width: '2160',
    height: '3840',
  },
]) // size
selectImageSize.value = imageSizeList.value[0]

const steps = ref<number>(20) // 迭代步数
const seed = ref<number>(-1) // 控制生成图像的随机性

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

/**  图片生产  */
const handlerGenerateImage = async () => {
  // 二次确认
  await message.confirm(`确认生成内容?`)
  try {
    // 加载中
    drawIn.value = true
    // 回调
    emits('onDrawStart', 'StableDiffusion')
    const form = {
      platform: 'StableDiffusion',
      model: 'stable-diffusion-v1-6',
      prompt: prompt.value, // 提示词
      width: selectImageSize.value.width, // 图片宽度
      height: selectImageSize.value.height, // 图片高度
      options: {
        sampler: selectSampler.value.key, // 采样算法
        seed: seed.value, // 随机种子
        steps: steps.value, // 图片生成步数
      },
    } as ImageDrawReqVO
    // 发送请求
    await ImageApi.drawImage(form)
  } finally {
    // 回调
    emits('onDrawComplete', 'StableDiffusion')
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
.group-item {
  margin-top: 30px;

  .group-item-body {
    margin-top: 15px;
    width: 100%;
  }
}


.btns {
  display: flex;
  justify-content: center;
  margin-top: 50px;
}
</style>
