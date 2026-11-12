<!-- AI 绘图：Midjourney 的创作表单（五种模式；参数按版本门禁） -->
<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- 参数区单独滚动；生成按钮在下方单独占一行（与 AI 对话左侧底栏的布局方式一致） -->
    <el-form label-position="top" class="min-h-0 flex-1 overflow-y-auto">
      <!-- 模式 -->
      <el-form-item label="模式">
        <el-radio-group v-model="mode">
          <el-radio-button v-for="item in MJ_MODES" :key="item.mode" :value="item.mode">
            {{ item.name }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 融图 -->
      <template v-if="mode === AiImageModeEnum.MIDJOURNEY_BLEND">
        <el-form-item label="融图图片（2–5 张）">
          <UploadImgs
            v-model="blendImageUrls"
            :limit="5"
            :file-size="MJ_IMAGE_MAX_MB"
            :file-type="IMAGE_ACCEPT"
            directory="ai/image"
            width="80px"
            height="80px"
          />
        </el-form-item>
        <el-form-item label="尺寸">
          <el-radio-group v-model="dimensions">
            <el-radio-button
              v-for="item in MJ_BLEND_DIMENSIONS"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- 换脸 -->
      <template v-else-if="mode === AiImageModeEnum.MIDJOURNEY_SWAP_FACE">
        <div class="flex gap-16px">
          <el-form-item label="来源脸">
            <UploadImg
              v-model="swapSourceUrl"
              :file-size="MJ_IMAGE_MAX_MB"
              :file-type="IMAGE_ACCEPT"
              directory="ai/image"
              width="120px"
              height="120px"
            />
          </el-form-item>
          <el-form-item label="目标图">
            <UploadImg
              v-model="swapTargetUrl"
              :file-size="MJ_IMAGE_MAX_MB"
              :file-type="IMAGE_ACCEPT"
              directory="ai/image"
              width="120px"
              height="120px"
            />
          </el-form-item>
        </div>
        <div class="mb-16px text-12px text-[var(--el-text-color-secondary)]">
          把来源脸换到目标图上；换脸结果没有 U / V 按钮
        </div>
      </template>

      <!-- 文生图、图生图、一致性 -->
      <template v-else>
        <el-form-item label="画面描述">
          <el-input
            v-model="formData.prompt"
            type="textarea"
            :rows="5"
            :maxlength="PROMPT_MAX"
            show-word-limit
            placeholder="例如：a cinematic shot of an ancient Chinese city at night"
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
              v-for="hotWord in ImageHotEnglishWords"
              :key="hotWord"
              class="cursor-pointer"
              effect="plain"
              @click="formData.prompt = hotWord"
            >
              {{ hotWord }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="不希望出现的内容（--no）">
          <el-input
            v-model="formData.negativePrompt"
            type="textarea"
            :rows="2"
            :maxlength="NEGATIVE_PROMPT_MAX"
            show-word-limit
            placeholder="例如：text, watermark"
          />
        </el-form-item>

        <!-- 图生图：参考图 -->
        <el-form-item v-if="mode === AiImageModeEnum.MIDJOURNEY_IMAGE" label="参考图（1–5 张）">
          <UploadImgs
            v-model="formData.referenceImageUrls"
            :limit="5"
            :file-size="MJ_IMAGE_MAX_MB"
            :file-type="IMAGE_ACCEPT"
            directory="ai/image"
            width="80px"
            height="80px"
          />
        </el-form-item>

        <!-- 版本 -->
        <el-form-item label="版本">
          <div class="grid grid-cols-2 w-full gap-8px">
            <div
              v-for="item in MJ_VERSIONS"
              :key="item.key"
              :class="getChipClass(versionKey === item.key)"
              @click="handleVersionChange(item.key)"
            >
              <span class="font-bold">{{ item.name }}</span>
              <span class="text-12px text-[var(--el-text-color-secondary)]">{{ item.badge }}</span>
            </div>
          </div>
        </el-form-item>

        <!-- 比例 -->
        <el-form-item label="比例">
          <el-radio-group v-model="formData.aspectRatio" size="small">
            <el-radio-button v-for="ratio in MJ_RATIOS" :key="ratio" :value="ratio">
              {{ ratio }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 图生图：图片权重 -->
        <el-form-item v-if="mode === AiImageModeEnum.MIDJOURNEY_IMAGE" label="图片权重（--iw）">
          <el-slider
            v-if="version.iw"
            v-model="formData.imageWeight"
            :min="version.iw.min"
            :max="version.iw.max"
            :step="0.1"
            show-input
            class="w-full"
          />
          <div v-else class="text-12px text-[var(--el-text-color-secondary)]">
            {{ version.why?.iw }}
          </div>
        </el-form-item>

        <!-- 一致性：角色参考、风格参考 -->
        <template v-if="mode === AiImageModeEnum.MIDJOURNEY_CONSISTENCY">
          <el-form-item label="角色参考（--cref）">
            <template v-if="version.cref">
              <UploadImg
                v-model="formData.crefUrl"
                :file-size="MJ_IMAGE_MAX_MB"
                :file-type="IMAGE_ACCEPT"
                directory="ai/image"
                width="100px"
                height="100px"
              />
              <div class="w-full">
                <span class="text-12px">角色权重（--cw）</span>
                <el-slider v-model="formData.characterWeight" :min="0" :max="100" show-input />
              </div>
            </template>
            <div v-else class="text-12px text-[var(--el-text-color-secondary)]">
              {{ version.why?.cref || '--cref 是旧版角色参考，仅 V6.1、Niji 6 可用' }}
            </div>
          </el-form-item>
          <el-form-item label="风格参考（--sref）">
            <UploadImg
              v-model="formData.srefUrl"
              :file-size="MJ_IMAGE_MAX_MB"
              :file-type="IMAGE_ACCEPT"
              directory="ai/image"
              width="100px"
              height="100px"
            />
            <div class="w-full">
              <span class="text-12px">风格权重（--sw）</span>
              <el-slider v-model="formData.styleWeight" :min="0" :max="1000" show-input />
            </div>
            <div v-if="version.sv" class="w-full">
              <el-checkbox
                v-if="version.sv.min === version.sv.max"
                v-model="styleVersionEnabled"
                :label="`附加 --sv ${version.sv.min}`"
              />
              <template v-else>
                <el-checkbox v-model="styleVersionEnabled" label="风格版本（--sv）" />
                <el-input-number
                  v-if="styleVersionEnabled"
                  v-model="formData.styleVersion"
                  :min="version.sv.min"
                  :max="version.sv.max"
                  controls-position="right"
                  class="ml-8px !w-120px"
                />
              </template>
            </div>
          </el-form-item>
          <!-- 官方新能力：中转未适配，禁用并说明 -->
          <div
            v-if="version.omni"
            class="mb-12px border border-[var(--el-border-color)] rounded-6px border-dashed p-10px text-12px text-[var(--el-text-color-secondary)] leading-18px"
          >
            <div class="font-bold">Omni Reference（--oref / --ow）· 暂不可用</div>
            {{ MJ_ADAPTER.omniReference.reason }}
          </div>
          <div
            v-if="version.edit"
            class="mb-12px border border-[var(--el-border-color)] rounded-6px border-dashed p-10px text-12px text-[var(--el-text-color-secondary)] leading-18px"
          >
            <div class="font-bold">V8 Edit（--edit）· 暂不可用</div>
            {{ MJ_ADAPTER.edit.reason }}
          </div>
        </template>

        <!-- 按版本的参数 -->
        <el-collapse class="mb-16px">
          <el-collapse-item title="更多参数" name="more">
            <el-form-item v-if="version.quality.length" label="画质（--q）">
              <el-radio-group v-model="formData.quality">
                <el-radio-button :value="0">默认</el-radio-button>
                <el-radio-button v-for="quality in version.quality" :key="quality" :value="quality">
                  {{ quality }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <div class="flex flex-wrap gap-x-24px">
              <el-form-item label="平铺（--tile）">
                <el-switch v-model="formData.tile" />
              </el-form-item>
              <el-form-item v-if="version.raw" label="RAW（--raw）">
                <el-switch v-model="formData.raw" />
              </el-form-item>
              <el-form-item v-if="version.hd" label="HD（--hd）">
                <el-switch v-model="formData.hd" active-text="HD" inactive-text="SD" />
              </el-form-item>
            </div>
            <el-form-item label="创意度（--c，0–100）">
              <el-input-number
                v-model="formData.chaos"
                :min="0"
                :max="100"
                placeholder="默认"
                controls-position="right"
                class="!w-full"
              />
            </el-form-item>
            <el-form-item label="风格化（--s，0–1000）">
              <el-input-number
                v-model="formData.stylize"
                :min="0"
                :max="1000"
                placeholder="默认"
                controls-position="right"
                class="!w-full"
              />
            </el-form-item>
            <el-form-item label="随机种子（--seed，-1 表示随机）">
              <el-input-number
                v-model="formData.seed"
                :min="-1"
                :max="4294967295"
                controls-position="right"
                class="!w-full"
              />
            </el-form-item>
            <div class="text-12px text-[var(--el-text-color-secondary)] leading-18px">
              <div v-for="(reason, key) in version.why" :key="key">{{ reason }}</div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 提交预览 -->
        <div
          class="mb-16px break-all rounded-6px bg-[var(--el-fill-color-light)] p-10px text-12px leading-18px"
        >
          <div class="mb-4px text-[var(--el-text-color-secondary)]">提交预览</div>
          {{ finalPrompt }}
        </div>
      </template>
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
import { ImageApi, ImageMidjourneyImagineReqVO, ImageVO } from '@/api/ai/image'
import { ModelVO } from '@/api/ai/model/model'
import { ImageHotEnglishWords } from '@/views/ai/utils/constants'
import {
  AiImageInputRoleEnum,
  AiImageModeEnum,
  MJ_ADAPTER,
  MJ_BLEND_DIMENSIONS,
  MJ_DEFAULT_VERSION,
  MJ_IMAGE_MAX_MB,
  MJ_MODES,
  MJ_RATIOS,
  MJ_VERSIONS,
  buildMidjourneyPrompt,
  getMjVersion,
  getMjVersionByFlag
} from '../../constants/imageCapabilities'

defineOptions({ name: 'AiImageMidjourneyForm' })

const props = defineProps({
  model: {
    type: Object as PropType<ModelVO>,
    required: true
  }
})
const emit = defineEmits(['submitted'])

const message = useMessage() // 消息弹窗

const PROMPT_MAX = 1200 // 与 AiMidjourneyImagineReqVO.prompt 上限一致
const NEGATIVE_PROMPT_MAX = 2000
const IMAGE_ACCEPT = ['image/png', 'image/jpeg', 'image/webp']

const mode = ref<number>(AiImageModeEnum.MIDJOURNEY_IMAGINE) // 子模式

/** 文生图、图生图、一致性的参数 */
const buildInitialFormData = () => ({
  prompt: '',
  negativePrompt: '',
  aspectRatio: '1:1',
  quality: 0, // 0 表示默认：不发送 --q
  stylize: undefined as number | undefined,
  chaos: undefined as number | undefined,
  seed: -1,
  tile: false,
  raw: false,
  hd: false,
  referenceImageUrls: [] as string[],
  imageWeight: 1,
  crefUrl: '',
  characterWeight: 100,
  srefUrl: '',
  styleWeight: 100,
  styleVersion: undefined as number | undefined
})
const formData = ref(buildInitialFormData())
const versionKey = ref(MJ_DEFAULT_VERSION)
const version = computed(() => getMjVersion(versionKey.value))
const styleVersionEnabled = ref(false) // 是否附加 --sv

/** 融图、换脸的参数 */
const blendImageUrls = ref<string[]>([])
const dimensions = ref('SQUARE')
const swapSourceUrl = ref('')
const swapTargetUrl = ref('')

const getChipClass = (active: boolean) => [
  'flex cursor-pointer flex-col gap-2px border border-[var(--el-border-color)] rounded-6px border-solid px-10px py-6px leading-18px',
  active
    ? '!border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
    : 'hover:border-[var(--el-border-color-darker)]'
]

/** 切换版本：清除新版本不支持的参数（不显示、不发送） */
const handleVersionChange = (key: string) => {
  versionKey.value = key
  const current = version.value
  const data = formData.value
  if (data.quality && !current.quality.includes(data.quality)) {
    data.quality = 0
  }
  if (!current.raw) {
    data.raw = false
  }
  if (!current.hd) {
    data.hd = false
  }
  data.imageWeight = current.iw ? Math.min(data.imageWeight, current.iw.max) : 1
  if (!current.cref) {
    data.crefUrl = ''
  }
  if (!current.sv) {
    styleVersionEnabled.value = false
  } else {
    data.styleVersion = current.sv.default
  }
}

/** 构建文生图、图生图、一致性的请求 */
const buildImagineReqVO = (): ImageMidjourneyImagineReqVO => {
  const data = formData.value
  const current = version.value
  const isImage = mode.value === AiImageModeEnum.MIDJOURNEY_IMAGE
  const isConsistency = mode.value === AiImageModeEnum.MIDJOURNEY_CONSISTENCY
  const srefUrl = isConsistency && data.srefUrl ? data.srefUrl : undefined
  return {
    modelId: props.model.id,
    mode: mode.value,
    prompt: data.prompt,
    negativePrompt: data.negativePrompt || undefined,
    version: current.flag,
    aspectRatio: data.aspectRatio,
    quality: current.quality.length && data.quality ? data.quality : undefined,
    stylize: data.stylize ?? undefined,
    chaos: data.chaos ?? undefined,
    seed: data.seed ?? -1,
    tile: data.tile,
    raw: current.raw ? data.raw : false,
    hd: current.hd ? data.hd : false,
    referenceImageUrls: isImage ? data.referenceImageUrls : undefined,
    imageWeight: isImage && current.iw ? data.imageWeight : undefined,
    crefUrl: isConsistency && current.cref && data.crefUrl ? data.crefUrl : undefined,
    characterWeight:
      isConsistency && current.cref && data.crefUrl ? data.characterWeight : undefined,
    srefUrl,
    styleWeight: srefUrl ? data.styleWeight : undefined,
    styleVersion:
      srefUrl && current.sv && styleVersionEnabled.value
        ? (data.styleVersion ?? current.sv.default)
        : undefined
  }
}

/** 提交预览：与后端拼接的 finalPrompt 一致 */
const finalPrompt = computed(() => buildMidjourneyPrompt(buildImagineReqVO()))

/** 随机热词 */
const handleRandomHotWord = () => {
  formData.value.prompt =
    ImageHotEnglishWords[Math.floor(Math.random() * ImageHotEnglishWords.length)]
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
    formData.value.prompt = prompt.slice(0, PROMPT_MAX)
  } finally {
    optimizing.value = false
  }
}

/** 提交 */
const submitting = ref(false)
const handleSubmit = async () => {
  // 1. 校验各模式需要的图片
  const data = formData.value
  if (mode.value === AiImageModeEnum.MIDJOURNEY_BLEND) {
    if (blendImageUrls.value.length < 2) {
      message.warning('融图需要 2–5 张图片')
      return
    }
  } else if (mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
    if (!swapSourceUrl.value || !swapTargetUrl.value) {
      message.warning('请上传来源脸与目标图')
      return
    }
  } else {
    if (!data.prompt?.trim()) {
      message.warning('请输入画面描述')
      return
    }
    if (mode.value === AiImageModeEnum.MIDJOURNEY_IMAGE && data.referenceImageUrls.length === 0) {
      message.warning('图生图至少需要 1 张参考图')
      return
    }
    if (
      mode.value === AiImageModeEnum.MIDJOURNEY_CONSISTENCY &&
      !(version.value.cref && data.crefUrl) &&
      !data.srefUrl
    ) {
      message.warning('一致性至少需要 1 张角色或风格参考图')
      return
    }
  }

  // 2. 按模式提交
  submitting.value = true
  try {
    if (mode.value === AiImageModeEnum.MIDJOURNEY_BLEND) {
      await ImageApi.midjourneyBlend({
        modelId: props.model.id,
        imageUrls: blendImageUrls.value,
        dimensions: dimensions.value
      })
    } else if (mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
      await ImageApi.midjourneySwapFace({
        modelId: props.model.id,
        sourceUrl: swapSourceUrl.value,
        targetUrl: swapTargetUrl.value
      })
    } else {
      await ImageApi.midjourneyImagine(buildImagineReqVO())
    }
    message.success('已提交，生成结果见右侧我的作品')
    emit('submitted')
  } finally {
    submitting.value = false
  }
}

/** 重新生成：按原记录的模式回填 */
const setValues = (image: ImageVO) => {
  const getImageUrls = (role: string) =>
    (image.inputImages || []).filter((item) => item.role === role).map((item) => item.url)
  const isRegenerateMode = MJ_MODES.some((item) => item.mode === image.mode)
  mode.value = isRegenerateMode ? image.mode : AiImageModeEnum.MIDJOURNEY_IMAGINE
  const options = image.midjourneyOptions || {}
  if (mode.value === AiImageModeEnum.MIDJOURNEY_BLEND) {
    blendImageUrls.value = getImageUrls(AiImageInputRoleEnum.BLEND)
    dimensions.value = options.dimensions || 'SQUARE'
    return
  }
  if (mode.value === AiImageModeEnum.MIDJOURNEY_SWAP_FACE) {
    swapSourceUrl.value = getImageUrls(AiImageInputRoleEnum.SWAP_SOURCE)[0] || ''
    swapTargetUrl.value = getImageUrls(AiImageInputRoleEnum.SWAP_TARGET)[0] || ''
    return
  }
  // 文生图、图生图、一致性：版本不在常量中时使用默认版本
  versionKey.value = getMjVersionByFlag(options.version)?.key || MJ_DEFAULT_VERSION
  const data = buildInitialFormData()
  data.prompt = image.prompt
  data.negativePrompt = image.negativePrompt || ''
  if (options.aspectRatio && MJ_RATIOS.includes(options.aspectRatio)) {
    data.aspectRatio = options.aspectRatio
  }
  data.quality = options.quality ?? 0
  data.stylize = options.stylize ?? undefined
  data.chaos = options.chaos ?? undefined
  data.seed = options.seed ?? -1
  data.tile = !!options.tile
  data.raw = !!options.raw
  data.hd = !!options.hd
  data.referenceImageUrls = getImageUrls(AiImageInputRoleEnum.REFERENCE).slice(0, 5)
  data.imageWeight = options.imageWeight ?? 1
  data.crefUrl = getImageUrls(AiImageInputRoleEnum.CREF)[0] || ''
  data.characterWeight = options.characterWeight ?? 100
  data.srefUrl = getImageUrls(AiImageInputRoleEnum.SREF)[0] || ''
  data.styleWeight = options.styleWeight ?? 100
  data.styleVersion = options.styleVersion ?? undefined
  styleVersionEnabled.value = options.styleVersion != null
  formData.value = data
  // 回填后按版本清除不支持的参数
  handleVersionChange(versionKey.value)
  if (options.styleVersion != null) {
    formData.value.styleVersion = options.styleVersion
  }
}

defineExpose({ setValues })
</script>
