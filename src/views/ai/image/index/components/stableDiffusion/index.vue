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
        v-for="hotWord in ImageHotEnglishWords"
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
      <el-select v-model="sampler" placeholder="Select" size="large" class="!w-350px">
        <el-option
          v-for="item in StableDiffusionSamplers"
          :key="item.key"
          :label="item.name"
          :value="item.key"
        />
      </el-select>
    </el-space>
  </div>
  <div class="group-item">
    <div>
      <el-text tag="b">CLIP</el-text>
    </div>
    <el-space wrap class="group-item-body">
      <el-select v-model="clipGuidancePreset" placeholder="Select" size="large" class="!w-350px">
        <el-option
          v-for="item in StableDiffusionClipGuidancePresets"
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
      <el-select v-model="stylePreset" placeholder="Select" size="large" class="!w-350px">
        <el-option
          v-for="item in StableDiffusionStylePresets"
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
      <el-input v-model="width" class="w-170px" placeholder="图片宽度" />
      <el-input v-model="height" class="w-170px" placeholder="图片高度" />
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
        class="!w-350px"
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
        class="!w-350px"
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
        class="!w-350px"
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
import {
  AiPlatformEnum,
  ImageHotEnglishWords,
  StableDiffusionClipGuidancePresets,
  StableDiffusionSamplers,
  StableDiffusionStylePresets
} from '@/views/ai/utils/constants'

const message = useMessage() // 消息弹窗

// 定义属性
const drawIn = ref<boolean>(false) // 生成中
const selectHotWord = ref<string>('') // 选中的热词
// 表单
const prompt = ref<string>('') // 提示词
const width = ref<number>(512) // 图片宽度
const height = ref<number>(512) // 图片高度
const sampler = ref<string>('DDIM') // 采样方法
const steps = ref<number>(20) // 迭代步数
const seed = ref<number>(42) // 控制生成图像的随机性
const scale = ref<number>(7.5) // 引导系数
const clipGuidancePreset = ref<string>('NONE') // 文本提示相匹配的图像(clip_guidance_preset) 简称 CLIP
const stylePreset = ref<string>('3d-model') // 风格

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
  prompt.value = hotWord // 替换提示词
}

/** 图片生成 */
const handleGenerateImage = async () => {
  // 二次确认
  if (hasChinese(prompt.value)) {
    message.alert('暂不支持中文！')
    return
  }
  await message.confirm(`确认生成内容?`)

  try {
    // 加载中
    drawIn.value = true
    // 回调
    emits('onDrawStart', AiPlatformEnum.STABLE_DIFFUSION)
    // 发送请求
    const form = {
      platform: AiPlatformEnum.STABLE_DIFFUSION,
      model: 'stable-diffusion-v1-6',
      prompt: prompt.value, // 提示词
      width: width.value, // 图片宽度
      height: height.value, // 图片高度
      options: {
        seed: seed.value, // 随机种子
        steps: steps.value, // 图片生成步数
        scale: scale.value, // 引导系数
        sampler: sampler.value, // 采样算法
        clipGuidancePreset: clipGuidancePreset.value, // 文本提示相匹配的图像 CLIP
        stylePreset: stylePreset.value // 风格
      }
    } as ImageDrawReqVO
    await ImageApi.drawImage(form)
  } finally {
    // 回调
    emits('onDrawComplete', AiPlatformEnum.STABLE_DIFFUSION)
    // 加载结束
    drawIn.value = false
  }
}

/** 填充值 */
const settingValues = async (detail: ImageVO) => {
  prompt.value = detail.prompt
  width.value = detail.width
  height.value = detail.height
  seed.value = detail.options?.seed
  steps.value = detail.options?.steps
  scale.value = detail.options?.scale
  sampler.value = detail.options?.sampler
  clipGuidancePreset.value = detail.options?.clipGuidancePreset
  stylePreset.value = detail.options?.stylePreset
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
