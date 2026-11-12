<!-- AI 绘图：通用模型、Seedream 的创作表单（字段按模型能力常量显示） -->
<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- 参数区单独滚动；生成按钮在下方单独占一行（与 AI 对话左侧底栏的布局方式一致） -->
    <el-form
      ref="formRef"
      :model="formData"
      label-position="top"
      class="min-h-0 flex-1 overflow-y-auto"
    >
      <el-alert
        v-if="capability.status?.legacy"
        :title="capability.status.legacy"
        type="warning"
        :closable="false"
        show-icon
        class="mb-12px"
      />
      <!-- 提示词 -->
      <el-form-item label="画面描述" prop="prompt">
        <el-input
          v-model="formData.prompt"
          type="textarea"
          :rows="5"
          :maxlength="capability.promptMax"
          show-word-limit
          placeholder="例如：童话里的小屋应该是什么样子？"
        />
        <div class="mt-8px w-full flex flex-wrap items-center gap-6px">
          <el-button
            size="small"
            type="primary"
            plain
            :loading="optimizing"
            @click="handleOptimizePrompt"
          >
            生成专业绘画指令
          </el-button>
          <el-button size="small" @click="handleRandomHotWord">随机热词</el-button>
          <el-tag
            v-for="hotWord in ImageHotWords"
            :key="hotWord"
            class="cursor-pointer"
            effect="plain"
            @click="formData.prompt = hotWord"
          >
            {{ hotWord }}
          </el-tag>
        </div>
      </el-form-item>
      <!-- 不希望出现的内容 -->
      <el-form-item v-if="capability.negativePrompt" label="不希望出现的内容" prop="negativePrompt">
        <el-input
          v-model="formData.negativePrompt"
          type="textarea"
          :rows="2"
          :maxlength="NEGATIVE_PROMPT_MAX"
          show-word-limit
          placeholder="例如：文字、水印、模糊"
        />
      </el-form-item>
      <!-- 参考图 -->
      <el-form-item
        v-if="capability.reference.max > 0"
        :label="`参考图（最多 ${capability.reference.max} 张）`"
      >
        <UploadImgs
          v-model="formData.referenceImageUrls"
          :limit="capability.reference.max"
          :file-size="capability.reference.maxMb"
          :file-type="capability.reference.accept"
          directory="ai/image"
          width="80px"
          height="80px"
        />
        <div class="text-12px text-[var(--el-text-color-secondary)] leading-18px">
          单张 ≤ {{ capability.reference.maxMb }} MB，{{ acceptText }}
        </div>
      </el-form-item>
      <!-- 尺寸：固定尺寸 / 像素宽高 -->
      <el-form-item v-if="capability.sizeMode !== 'tier'" label="尺寸">
        <div class="grid grid-cols-3 w-full gap-8px">
          <div
            v-for="size in capability.sizes"
            :key="size"
            :class="getChipClass(!customSize && formData.size === size)"
            @click="handleSizeClick(size)"
          >
            <span class="font-bold">{{ getRatioText(size) }}</span>
            <span class="text-12px text-[var(--el-text-color-secondary)]">{{ size }}</span>
          </div>
          <div
            v-if="capability.custom"
            :class="getChipClass(customSize)"
            @click="customSize = true"
          >
            <span class="font-bold">自定义</span>
            <span class="text-12px text-[var(--el-text-color-secondary)]">
              {{ capability.custom.min }}–{{ capability.custom.max }}
            </span>
          </div>
        </div>
        <div v-if="customSize && capability.custom" class="mt-8px w-full flex items-center gap-8px">
          <el-input-number
            v-model="formData.width"
            :min="capability.custom.min"
            :max="capability.custom.max"
            :step="capability.custom.step"
            step-strictly
            controls-position="right"
            class="!w-140px"
          />
          <span>×</span>
          <el-input-number
            v-model="formData.height"
            :min="capability.custom.min"
            :max="capability.custom.max"
            :step="capability.custom.step"
            step-strictly
            controls-position="right"
            class="!w-140px"
          />
          <span class="text-12px text-[var(--el-text-color-secondary)]">
            {{ capability.custom.step }} 的倍数
          </span>
        </div>
      </el-form-item>
      <!-- 尺寸：档位（Seedream） -->
      <el-form-item v-else label="尺寸档位">
        <el-radio-group v-model="formData.sizeLevel">
          <el-radio-button v-for="tier in capability.tiers" :key="tier" :value="tier">
            {{ tier }}
          </el-radio-button>
        </el-radio-group>
        <div class="w-full text-12px text-[var(--el-text-color-secondary)] leading-18px">
          按档位提交，画面比例请在描述中说明
        </div>
      </el-form-item>
      <!-- 画质 -->
      <el-form-item v-if="capability.qualities?.length" label="画质">
        <el-radio-group v-model="formData.quality">
          <el-radio-button v-for="quality in capability.qualities" :key="quality" :value="quality">
            {{ quality }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <!-- 高级参数 -->
      <el-collapse v-if="capability.advanced?.length || capability.fixed?.length" class="mb-16px">
        <el-collapse-item v-if="capability.advanced?.length" title="高级参数" name="advanced">
          <div class="grid grid-cols-2 gap-x-12px">
            <el-form-item
              v-for="field in capability.advanced"
              :key="field.key"
              :label="field.label"
            >
              <el-select
                v-if="field.type === 'select'"
                v-model="formData[field.key]"
                class="!w-full"
              >
                <el-option
                  v-for="option in field.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <el-input-number
                v-else
                v-model="formData[field.key]"
                :min="field.min"
                :max="field.max"
                :step="field.step || 1"
                :placeholder="field.placeholder"
                controls-position="right"
                class="!w-full"
              />
            </el-form-item>
          </div>
        </el-collapse-item>
        <el-collapse-item v-if="capability.fixed?.length" title="固定参数与写法建议" name="fixed">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item
              v-for="item in capability.fixed"
              :key="item.name"
              :label="item.name"
            >
              {{ item.value }}
              <span class="text-12px text-[var(--el-text-color-secondary)]"
                >（{{ item.note }}）</span
              >
            </el-descriptions-item>
          </el-descriptions>
          <ul
            class="mb-0 mt-8px pl-18px text-12px text-[var(--el-text-color-secondary)] leading-20px"
          >
            <li v-for="item in capability.guide" :key="item">{{ item }}</li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </el-form>
    <!-- 生成按钮：在参数区下方单独占一行，不随参数滚动 -->
    <div class="flex-shrink-0 pt-12px">
      <el-button
        type="primary"
        size="large"
        class="w-full"
        :loading="submitting"
        @click="handleSubmit"
      >
        生成图片
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue'
import { ImageApi, ImageDrawReqVO, ImageVO } from '@/api/ai/image'
import { ModelVO } from '@/api/ai/model/model'
import { ImageHotWords } from '@/views/ai/utils/constants'
import {
  AiImageInputRoleEnum,
  ImageModelCapability,
  getSizeRatio,
  parseSize
} from '../../constants/imageCapabilities'

defineOptions({ name: 'AiImageDrawForm' })

const props = defineProps({
  model: {
    type: Object as PropType<ModelVO>,
    required: true
  },
  capability: {
    type: Object as PropType<ImageModelCapability>,
    required: true
  }
})
const emit = defineEmits(['submitted'])

const message = useMessage() // 消息弹窗

const NEGATIVE_PROMPT_MAX = 2000 // 与 AiImageDrawReqVO.negativePrompt 上限一致

/** 表单的初始值：取模型能力的第一项、高级参数的默认值 */
const buildInitialFormData = () => {
  const data: Record<string, any> = {
    prompt: '',
    negativePrompt: '',
    referenceImageUrls: [] as string[],
    size: props.capability.sizes?.[0],
    width: undefined as number | undefined,
    height: undefined as number | undefined,
    sizeLevel: props.capability.tiers?.[0],
    quality: props.capability.qualities?.[0]
  }
  props.capability.advanced?.forEach((field) => {
    data[field.key] = field.default
  })
  if (data.size) {
    Object.assign(data, parseSize(data.size))
  }
  return data
}
const formData = ref<Record<string, any>>(buildInitialFormData())
const customSize = ref(false) // 是否自定义宽高

const acceptText = computed(() =>
  (props.capability.reference.accept || []).map((type) => type.replace('image/', '')).join(' / ')
)

const getChipClass = (active: boolean) => [
  'flex cursor-pointer flex-col items-center gap-2px border border-[var(--el-border-color)] rounded-6px border-solid px-4px py-8px leading-18px',
  active
    ? '!border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
    : 'hover:border-[var(--el-border-color-darker)]'
]

const getRatioText = (size: string) => {
  const { width, height } = parseSize(size)
  return getSizeRatio(width, height)
}

/** 选择尺寸 */
const handleSizeClick = (size: string) => {
  customSize.value = false
  formData.value.size = size
  Object.assign(formData.value, parseSize(size))
}

/** 随机热词 */
const handleRandomHotWord = () => {
  formData.value.prompt = ImageHotWords[Math.floor(Math.random() * ImageHotWords.length)]
}

/** 生成专业绘画指令 */
const optimizing = ref(false)
const handleOptimizePrompt = async () => {
  if (!formData.value.prompt?.trim()) {
    message.warning('请先输入画面描述')
    return
  }
  optimizing.value = true
  try {
    const prompt: string = await ImageApi.optimizePrompt(formData.value.prompt)
    formData.value.prompt = prompt.slice(0, props.capability.promptMax)
  } finally {
    optimizing.value = false
  }
}

/** 提交 */
const submitting = ref(false)
const handleSubmit = async () => {
  const data = formData.value
  if (!data.prompt?.trim()) {
    message.warning('请输入画面描述')
    return
  }
  if (customSize.value && (!data.width || !data.height)) {
    message.warning('请输入宽高')
    return
  }
  const capability = props.capability
  const isTier = capability.sizeMode === 'tier'
  const reqVO: ImageDrawReqVO = {
    modelId: props.model.id,
    prompt: data.prompt,
    negativePrompt: capability.negativePrompt ? data.negativePrompt || undefined : undefined,
    referenceImageUrls: capability.reference.max > 0 ? data.referenceImageUrls : undefined,
    width: isTier ? undefined : data.width,
    height: isTier ? undefined : data.height,
    sizeLevel: isTier ? data.sizeLevel : undefined,
    aspectRatio: isTier ? undefined : getSizeRatio(data.width, data.height),
    quality: capability.qualities?.length ? data.quality : undefined
  }
  capability.advanced?.forEach((field) => {
    const value = data[field.key]
    reqVO[field.key] = value === '' || value === null ? undefined : value
  })
  submitting.value = true
  try {
    await ImageApi.drawImage(reqVO)
    message.success('已提交，生成结果见右侧我的作品')
    emit('submitted')
  } finally {
    submitting.value = false
  }
}

/** 重新生成：回填参数；不在当前模型能力内的值不回填 */
const setValues = (image: ImageVO) => {
  const capability = props.capability
  const data = buildInitialFormData()
  data.prompt = image.prompt
  if (capability.negativePrompt) {
    data.negativePrompt = image.negativePrompt || ''
  }
  if (capability.reference.max > 0) {
    data.referenceImageUrls = (image.inputImages || [])
      .filter((item) => item.role === AiImageInputRoleEnum.REFERENCE)
      .map((item) => item.url)
      .slice(0, capability.reference.max)
  }
  if (capability.sizeMode === 'tier') {
    const size = image.seedreamOptions?.size
    if (size && capability.tiers?.includes(size)) {
      data.sizeLevel = size
    }
  } else if (image.width && image.height) {
    const size = `${image.width}x${image.height}`
    if (capability.sizes?.includes(size)) {
      data.size = size
      Object.assign(data, { width: image.width, height: image.height })
      customSize.value = false
    } else if (capability.custom) {
      Object.assign(data, { size: undefined, width: image.width, height: image.height })
      customSize.value = true
    }
  }
  const options = image.options || {}
  if (options.quality && capability.qualities?.includes(options.quality)) {
    data.quality = options.quality
  }
  capability.advanced?.forEach((field) => {
    if (options[field.key] !== undefined && options[field.key] !== null) {
      data[field.key] = options[field.key]
    }
  })
  formData.value = data
}

defineExpose({ setValues })
</script>
