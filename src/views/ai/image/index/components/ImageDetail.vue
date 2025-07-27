<template>
  <el-drawer
    v-model="showDrawer"
    title="图片详细"
    @close="handleDrawerClose"
    custom-class="drawer-class"
  >
    <!-- 图片预览 -->
    <div class="mb-5">
      <el-image
        :src="detail?.picUrl"
        :preview-src-list="[detail.picUrl]"
        preview-teleported
        class="w-full rounded-2"
        fit="contain"
      />
    </div>

    <!-- 基础信息 -->
    <el-descriptions title="基础信息" :column="1" :label-width="100" border>
      <el-descriptions-item label="提交时间">
        {{ formatTime(detail.createTime, 'yyyy-MM-dd HH:mm:ss') }}
      </el-descriptions-item>
      <el-descriptions-item label="生成时间">
        {{ formatTime(detail.finishTime, 'yyyy-MM-dd HH:mm:ss') }}
      </el-descriptions-item>
      <el-descriptions-item label="模型">
        {{ detail.model }}({{ detail.height }}x{{ detail.width }})
      </el-descriptions-item>
      <el-descriptions-item label="提示词">
        <div class="break-words">{{ detail.prompt }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="图片地址">
        <div class="break-all text-xs">{{ detail.picUrl }}</div>
      </el-descriptions-item>
    </el-descriptions>

    <!-- StableDiffusion 专属区域 -->
    <el-descriptions
      v-if="detail.platform === AiPlatformEnum.STABLE_DIFFUSION && hasStableDiffusionOptions"
      title="StableDiffusion 参数"
      :column="1"
      :label-width="100"
      border
      class="mt-5"
    >
      <el-descriptions-item v-if="detail?.options?.sampler" label="采样方法">
        {{
          StableDiffusionSamplers.find(
            (item: ImageModelVO) => item.key === detail?.options?.sampler
          )?.name
        }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detail?.options?.clipGuidancePreset" label="CLIP">
        {{
          StableDiffusionClipGuidancePresets.find(
            (item: ImageModelVO) => item.key === detail?.options?.clipGuidancePreset
          )?.name
        }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detail?.options?.stylePreset" label="风格">
        {{
          StableDiffusionStylePresets.find(
            (item: ImageModelVO) => item.key === detail?.options?.stylePreset
          )?.name
        }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detail?.options?.steps" label="迭代步数">
        {{ detail?.options?.steps }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detail?.options?.scale" label="引导系数">
        {{ detail?.options?.scale }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detail?.options?.seed" label="随机因子">
        {{ detail?.options?.seed }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- Dall3 专属区域 -->
    <el-descriptions
      v-if="detail.platform === AiPlatformEnum.OPENAI && detail?.options?.style"
      title="DALL-E 3 参数"
      :column="1"
      :label-width="100"
      border
      class="mt-5"
    >
      <el-descriptions-item label="风格选择">
        {{ Dall3StyleList.find((item: ImageModelVO) => item.key === detail?.options?.style)?.name }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- Midjourney 专属区域 -->
    <el-descriptions
      v-if="detail.platform === AiPlatformEnum.MIDJOURNEY && hasMidjourneyOptions"
      title="Midjourney 参数"
      :column="1"
      :label-width="100"
      border
      class="mt-5"
    >
      <el-descriptions-item v-if="detail?.options?.version" label="模型版本">
        {{ detail?.options?.version }}
      </el-descriptions-item>
      <el-descriptions-item v-if="detail?.options?.referImageUrl" label="参考图">
        <el-image
          :src="detail.options.referImageUrl"
          class="max-w-[200px] rounded-2"
          fit="contain"
        />
      </el-descriptions-item>
    </el-descriptions>
  </el-drawer>
</template>

<script setup lang="ts">
import { ImageApi, ImageVO } from '@/api/ai/image'
import {
  AiPlatformEnum,
  Dall3StyleList,
  ImageModelVO,
  StableDiffusionClipGuidancePresets,
  StableDiffusionSamplers,
  StableDiffusionStylePresets
} from '@/views/ai/utils/constants'
import { formatTime } from '@/utils'

const showDrawer = ref<boolean>(false) // 是否显示
const detail = ref<ImageVO>({} as ImageVO) // 图片详细信息

// 计算属性：判断是否有 StableDiffusion 选项
const hasStableDiffusionOptions = computed(() => {
  const options = detail.value?.options
  return (
    options?.sampler ||
    options?.clipGuidancePreset ||
    options?.stylePreset ||
    options?.steps ||
    options?.scale ||
    options?.seed
  )
})

// 计算属性：判断是否有 Midjourney 选项
const hasMidjourneyOptions = computed(() => {
  const options = detail.value?.options
  return options?.version || options?.referImageUrl
})

const props = defineProps({
  show: {
    type: Boolean,
    require: true,
    default: false
  },
  id: {
    type: Number,
    required: true
  }
})

/** 关闭抽屉  */
const handleDrawerClose = async () => {
  emits('handleDrawerClose')
}

/** 监听 drawer 是否打开 */
const { show } = toRefs(props)
watch(show, async (newValue, _oldValue) => {
  showDrawer.value = newValue as boolean
})

/**  获取图片详情  */
const getImageDetail = async (id: number) => {
  detail.value = await ImageApi.getImageMy(id)
}

/** 监听 id 变化，加载最新图片详情 */
const { id } = toRefs(props)
watch(id, async (newVal, _oldVal) => {
  if (newVal) {
    await getImageDetail(newVal)
  }
})

const emits = defineEmits(['handleDrawerClose'])
</script>
