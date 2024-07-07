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
      style="width: 100%; margin-top: 15px"
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
        v-for="hotWord in hotWords"
        :key="hotWord"
        @click="handleHotWordClick(hotWord)"
      >
        {{ hotWord }}
      </el-button>
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">采样方法</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-select v-model="selectSampler" placeholder="Select" size="large" style="width: 350px">
        <el-option v-for="item in sampler" :key="item.key" :label="item.name" :value="item.key" />
      </el-select>
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">CLIP</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-select
        v-model="selectClipGuidancePreset"
        placeholder="Select"
        size="large"
        style="width: 350px"
      >
        <el-option
          v-for="item in clipGuidancePresets"
          :key="item.key"
          :label="item.name"
          :value="item.key"
        />
      </el-select>
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">风格</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-select v-model="selectStylePreset" placeholder="Select" size="large" style="width: 350px">
        <el-option
          v-for="item in stylePresets"
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
      <el-input v-model="imageWidth" style="width: 170px" placeholder="图片宽度" />
      <el-input v-model="imageHeight" style="width: 170px" placeholder="图片高度" />
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">迭代步数</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-input
        v-model="steps"
        type="number"
        size="large"
        style="width: 350px"
        placeholder="Please input"
      />
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">引导系数</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-input
        v-model="scale"
        type="number"
        size="large"
        style="width: 350px"
        placeholder="Please input"
      />
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">随机因子</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-input
        v-model="seed"
        type="number"
        size="large"
        style="width: 350px"
        placeholder="Please input"
      />
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
import { hasChinese } from '@/views/ai/utils/utils'

// image 模型
interface ImageModelVO {
  key: string
  name: string
}

// 定义属性
const prompt = ref<string>('') // 提示词
const drawIn = ref<boolean>(false) // 生成中
const selectHotWord = ref<string>('') // 选中的热词
const imageWidth = ref<number>(512) // 图片宽度
const imageHeight = ref<number>(512) // 图片高度

const hotWords = ref<string[]>([
  '中国旗袍',
  '古装美女',
  '卡通头像',
  '机甲战士',
  '童话小屋',
  '中国长城'
]) // 热词
// message
const message = useMessage()

// 采样方法
const selectSampler = ref<string>('DDIM') // 模型
// DDIM DDPM K_DPMPP_2M K_DPMPP_2S_ANCESTRAL K_DPM_2 K_DPM_2_ANCESTRAL K_EULER K_EULER_ANCESTRAL K_HEUN K_LMS
const sampler = ref<ImageModelVO[]>([
  {
    key: 'DDIM',
    name: 'DDIM'
  },
  {
    key: 'DDPM',
    name: 'DDPM'
  },
  {
    key: 'K_DPMPP_2M',
    name: 'K_DPMPP_2M'
  },
  {
    key: 'K_DPMPP_2S_ANCESTRAL',
    name: 'K_DPMPP_2S_ANCESTRAL'
  },
  {
    key: 'K_DPM_2',
    name: 'K_DPM_2'
  },
  {
    key: 'K_DPM_2_ANCESTRAL',
    name: 'K_DPM_2_ANCESTRAL'
  },
  {
    key: 'K_EULER',
    name: 'K_EULER'
  },
  {
    key: 'K_EULER_ANCESTRAL',
    name: 'K_EULER_ANCESTRAL'
  },
  {
    key: 'K_HEUN',
    name: 'K_HEUN'
  },
  {
    key: 'K_LMS',
    name: 'K_LMS'
  }
])

// 风格
// 3d-model analog-film anime cinematic comic-book digital-art enhance fantasy-art isometric
// line-art low-poly modeling-compound neon-punk origami photographic pixel-art tile-texture
const selectStylePreset = ref<string>('3d-model') // 模型
const stylePresets = ref<ImageModelVO[]>([
  {
    key: '3d-model',
    name: '3d-model'
  },
  {
    key: 'analog-film',
    name: 'analog-film'
  },
  {
    key: 'anime',
    name: 'anime'
  },
  {
    key: 'cinematic',
    name: 'cinematic'
  },
  {
    key: 'comic-book',
    name: 'comic-book'
  },
  {
    key: 'digital-art',
    name: 'digital-art'
  },
  {
    key: 'enhance',
    name: 'enhance'
  },
  {
    key: 'fantasy-art',
    name: 'fantasy-art'
  },
  {
    key: 'isometric',
    name: 'isometric'
  },
  {
    key: 'line-art',
    name: 'line-art'
  },
  {
    key: 'low-poly',
    name: 'low-poly'
  },
  {
    key: 'modeling-compound',
    name: 'modeling-compound'
  },
  // neon-punk origami photographic pixel-art tile-texture
  {
    key: 'neon-punk',
    name: 'neon-punk'
  },
  {
    key: 'origami',
    name: 'origami'
  },
  {
    key: 'photographic',
    name: 'photographic'
  },
  {
    key: 'pixel-art',
    name: 'pixel-art'
  },
  {
    key: 'tile-texture',
    name: 'tile-texture'
  }
])

// 文本提示相匹配的图像(clip_guidance_preset) 简称 CLIP
// https://platform.stability.ai/docs/api-reference#tag/SDXL-and-SD1.6/operation/textToImage
// FAST_BLUE FAST_GREEN NONE SIMPLE SLOW SLOWER SLOWEST
const selectClipGuidancePreset = ref<string>('NONE') // 模型
const clipGuidancePresets = ref<ImageModelVO[]>([
  {
    key: 'NONE',
    name: 'NONE'
  },
  {
    key: 'FAST_BLUE',
    name: 'FAST_BLUE'
  },
  {
    key: 'FAST_GREEN',
    name: 'FAST_GREEN'
  },
  {
    key: 'SIMPLE',
    name: 'SIMPLE'
  },
  {
    key: 'SLOW',
    name: 'SLOW'
  },
  {
    key: 'SLOWER',
    name: 'SLOWER'
  },
  {
    key: 'SLOWEST',
    name: 'SLOWEST'
  }
])

const steps = ref<number>(20) // 迭代步数
const seed = ref<number>(42) // 控制生成图像的随机性
const scale = ref<number>(7.5) // 引导系数

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

/**  图片生产  */
const handleGenerateImage = async () => {
  // 二次确认
  await message.confirm(`确认生成内容?`)
  if (await hasChinese(prompt.value)) {
    message.alert('暂不支持中文！')
    return
  }
  try {
    // 加载中
    drawIn.value = true
    // 回调
    emits('onDrawStart', 'StableDiffusion')
    // 发送请求
    const form = {
      platform: 'StableDiffusion',
      model: 'stable-diffusion-v1-6',
      prompt: prompt.value, // 提示词
      width: imageWidth.value, // 图片宽度
      height: imageHeight.value, // 图片高度
      options: {
        seed: seed.value, // 随机种子
        steps: steps.value, // 图片生成步数
        scale: scale.value, // 引导系数
        sampler: selectSampler.value, // 采样算法
        clipGuidancePreset: selectClipGuidancePreset.value, // 文本提示相匹配的图像 CLIP
        stylePreset: selectStylePreset.value // 风格
      }
    } as ImageDrawReqVO
    await ImageApi.drawImage(form)
  } finally {
    // 回调
    emits('onDrawComplete', 'StableDiffusion')
    // 加载结束
    drawIn.value = false
  }
}

/** 填充值 */
const settingValues = async (imageDetail: ImageVO) => {
  prompt.value = imageDetail.prompt
  imageWidth.value = imageDetail.width
  imageHeight.value = imageDetail.height
  seed.value = imageDetail.options?.seed
  steps.value = imageDetail.options?.steps
  scale.value = imageDetail.options?.scale
  selectSampler.value = imageDetail.options?.sampler
  selectClipGuidancePreset.value = imageDetail.options?.clipGuidancePreset
  selectStylePreset.value = imageDetail.options?.stylePreset
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
