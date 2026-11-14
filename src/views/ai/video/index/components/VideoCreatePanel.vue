<!-- AI 视频：创作面板 -->
<template>
  <!-- 纵向 flex：参数区自己滚动，生成按钮在底部单独一行 -->
  <ContentWrap
    class="h-full !mb-0"
    :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
  >
    <el-tabs v-model="formData.type" class="flex-shrink-0" @tab-change="handleTypeChange">
      <el-tab-pane label="视频生成" :name="AiVideoTypeEnum.GENERATE" />
      <el-tab-pane label="数字人口播" :name="AiVideoTypeEnum.AVATAR" />
      <el-tab-pane label="动作模仿" :name="AiVideoTypeEnum.MOTION" />
    </el-tabs>
    <el-form :model="formData" label-position="top" class="min-h-0 flex-1 overflow-y-auto pr-4px">
      <VideoModelSelect
        v-model="formData.modelId"
        :models="typeModels"
        @change="handleModelChange"
      />

      <!-- 视频生成：生成方式与对应的输入 -->
      <template v-if="formData.type === AiVideoTypeEnum.GENERATE">
        <el-form-item label="生成方式">
          <el-radio-group v-model="formData.mode" @change="handleModeChange">
            <el-radio-button
              v-for="item in AiVideoModeOptions"
              :key="item.value"
              :value="item.value"
              :disabled="!capability.modes.includes(item.value)"
            >
              {{ item.label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="usesFirstFrame"
          :label="formData.mode === AiVideoModeEnum.IMAGE ? '首帧图片' : '首帧 / 尾帧'"
        >
          <div class="flex gap-8px">
            <UploadImg v-model="inputs.first_frame" height="100px" width="100px" :file-size="10">
              <template #tip>首帧</template>
            </UploadImg>
            <UploadImg
              v-if="formData.mode === AiVideoModeEnum.FIRST_LAST"
              v-model="inputs.last_frame"
              height="100px"
              width="100px"
              :file-size="10"
            >
              <template #tip>尾帧</template>
            </UploadImg>
          </div>
        </el-form-item>
        <template v-if="formData.mode === AiVideoModeEnum.REFERENCE">
          <el-form-item :label="`参考图（最多 ${capability.maxReferenceImages} 张）`">
            <UploadImgs
              v-model="inputs.reference_image"
              :limit="capability.maxReferenceImages || 1"
              height="80px"
              width="80px"
              :file-size="10"
            />
          </el-form-item>
          <el-form-item v-if="capability.referenceVideo" label="参考视频">
            <UploadFile
              v-model="inputs.reference_video"
              :file-type="['mp4', 'mov']"
              :file-size="50"
              :limit="1"
            />
          </el-form-item>
          <el-form-item v-if="capability.referenceAudio" label="参考音频">
            <UploadFile
              v-model="inputs.reference_audio"
              :file-type="['mp3', 'wav']"
              :file-size="15"
              :limit="1"
            />
          </el-form-item>
        </template>
      </template>

      <!-- 数字人口播、动作模仿：人物图片 + 驱动音频 / 动作视频 -->
      <template v-else>
        <el-form-item label="人物图片">
          <UploadImg v-model="inputs.image" height="120px" width="120px" :file-size="10" />
        </el-form-item>
        <el-form-item v-if="formData.type === AiVideoTypeEnum.AVATAR" label="驱动音频">
          <UploadFile
            v-model="inputs.audio"
            :file-type="['mp3', 'wav']"
            :file-size="15"
            :limit="1"
          />
          <div class="text-12px leading-18px text-[var(--el-text-color-secondary)]">
            上传口播音频，时长限制以所选模型为准
          </div>
        </el-form-item>
        <el-form-item v-else label="动作视频">
          <UploadFile
            v-model="inputs.video"
            :file-type="['mp4', 'mov']"
            :file-size="50"
            :limit="1"
          />
          <div class="text-12px leading-18px text-[var(--el-text-color-secondary)]">
            人物将模仿视频中的动作，时长限制以所选模型为准（例如 30 秒内）
          </div>
        </el-form-item>
      </template>

      <el-form-item
        v-if="formData.type !== AiVideoTypeEnum.MOTION"
        label="提示词"
        :required="capability.promptRequired"
      >
        <el-input
          v-model="formData.prompt"
          type="textarea"
          :rows="4"
          maxlength="2000"
          show-word-limit
          :placeholder="
            formData.type === AiVideoTypeEnum.AVATAR
              ? '可选：描述人物动作、表情或镜头'
              : '描述画面内容、动作与镜头，例如：一只橘猫在雨夜的霓虹街头奔跑，镜头跟随'
          "
        />
      </el-form-item>

      <!-- 参数 -->
      <VideoParamsForm
        v-model:resolution="formData.resolution"
        v-model:ratio="formData.ratio"
        v-model:duration="formData.duration"
        v-model:options="options"
        :type="formData.type"
        :capability="capability"
      />
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
        开始生成
      </el-button>
      <div class="mt-6px text-12px leading-18px text-[var(--el-text-color-secondary)]">
        生成为异步任务，通常需要几分钟；完成后会转存到文件服务并出现在「我的作品」中
      </div>
    </div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { VideoApi, VideoOptionsVO, VideoVO } from '@/api/ai/video'
import {
  AiModelTypeEnum,
  AiVideoModeEnum,
  AiVideoModeOptions,
  AiVideoTypeEnum
} from '@/views/ai/utils/constants'
import {
  getVideoInputRoles,
  getVideoModelCapability,
  isVideoModelOfType
} from '@/views/ai/utils/video'
import VideoModelSelect from './VideoModelSelect.vue'
import VideoParamsForm from './VideoParamsForm.vue'

/** AI 视频：创作面板 */
defineOptions({ name: 'AiVideoCreatePanel' })

const emit = defineEmits(['submitted'])
const message = useMessage() // 消息弹窗

const submitting = ref(false)
const formData = reactive({
  type: AiVideoTypeEnum.GENERATE,
  mode: AiVideoModeEnum.TEXT as string,
  modelId: undefined as number | undefined,
  prompt: '',
  resolution: undefined as string | undefined,
  ratio: undefined as string | undefined,
  duration: undefined as number | undefined
})
const options = ref<VideoOptionsVO>({}) // 其它生成参数
// 输入文件：单个为字符串，参考图为数组
const inputs = reactive({
  first_frame: '',
  last_frame: '',
  reference_image: [] as string[],
  reference_video: '',
  reference_audio: '',
  image: '',
  audio: '',
  video: ''
})

// ========== 服务商、模型 ==========

const allModels = ref<ModelVO[]>([]) // 全部视频模型
// TODO DONE @AI：看看哪些 modelselect 之类的？然后，一些是不是抽到 constants 里？（服务商、模型选择拆到 VideoModelSelect，生成参数拆到 VideoParamsForm；生成方式等选项抽到 constants 的 AiVideoModeOptions 等；通用 ModelSelect 没有按创作类型过滤，不直接复用）
/** 当前创作类型可用的模型 */
const typeModels = computed(() =>
  allModels.value.filter((item) => isVideoModelOfType(formData.type, item.platform, item.model))
)
const selectedModel = computed(() => allModels.value.find((item) => item.id === formData.modelId))
const capability = computed(() =>
  getVideoModelCapability(
    selectedModel.value?.platform,
    selectedModel.value?.model,
    formData.mode,
    formData.duration,
    options.value.generateAudio
  )
)
const usesFirstFrame = computed(
  () => formData.mode === AiVideoModeEnum.IMAGE || formData.mode === AiVideoModeEnum.FIRST_LAST
)

/** 切换创作类型：选中第一个模型（即第一个服务商的第一个模型） */
const handleTypeChange = () => {
  formData.modelId = typeModels.value[0]?.id
  handleModelChange()
}

/** 切换模型：生成方式、参数重置为模型的默认值 */
const handleModelChange = () => {
  if (!capability.value.modes.includes(formData.mode)) {
    formData.mode = capability.value.modes[0]
  }
  let cap = capability.value // 生成方式变化后，按新的方式重新计算
  formData.duration = cap.durations[0]
  options.value = {
    size: cap.sizes[0],
    quality: cap.fields.includes('quality') ? 'std' : undefined,
    promptExpansionMode: cap.fields.includes('promptExpansionMode') ? 'balanced' : undefined
  }
  cap = capability.value // 可选分辨率与时长、生成音频有关，按重置后的值再计算
  formData.resolution = cap.resolutions[0]
  formData.ratio = cap.ratios[0]
}

/** 切换生成方式、时长、生成音频：分辨率、比例、时长不再可选的，重置为默认值 */
const handleModeChange = () => {
  const cap = capability.value
  if (!cap.resolutions.includes(formData.resolution!)) {
    formData.resolution = cap.resolutions[0]
  }
  if (!cap.ratios.includes(formData.ratio!)) {
    formData.ratio = cap.ratios[0]
  }
  if (!cap.durations.includes(formData.duration!)) {
    formData.duration = cap.durations[0]
  }
}

// 海螺 10 秒只支持 768P，kling-2.6 生成音频只支持 1080p：时长、生成音频变化后，可选分辨率随之变化
watch(() => [formData.duration, options.value.generateAudio], handleModeChange)

// ========== 提交 ==========

/** 构建输入文件：只提交当前类型、方式使用的角色 */
const buildInputUrls = () => {
  const result: Record<string, string[]> = {}
  const { referenceVideo, referenceAudio } = capability.value
  getVideoInputRoles(formData.type, formData.mode).forEach((role) => {
    // 切换模型后，已隐藏的参考视频、参考音频不提交
    if (
      (role === 'reference_video' && !referenceVideo) ||
      (role === 'reference_audio' && !referenceAudio)
    ) {
      return
    }
    const value = (inputs as Record<string, string | string[]>)[role]
    const urls = (Array.isArray(value) ? value : value ? value.split(',') : []).filter(
      (url) => !!url
    )
    if (urls.length) {
      result[role] = urls
    }
  })
  return result
}

/** 构建生成参数：只提交模型、生成方式支持的，切换后不适用的、清空的都不提交 */
const buildOptions = (): VideoOptionsVO => {
  const fields = capability.value.fields
  return Object.fromEntries(
    Object.entries(options.value).filter(
      ([key, value]) =>
        fields.includes(key) && value !== undefined && value !== null && value !== ''
    )
  )
}

/** 前端只校验必填，参数的取值范围由服务端按模型校验 */
const validate = (inputUrls: Record<string, string[]>) => {
  if (!formData.modelId) {
    return '请选择模型'
  }
  if (formData.type === AiVideoTypeEnum.AVATAR) {
    return !inputUrls.image ? '请上传人物图片' : !inputUrls.audio ? '请上传驱动音频' : undefined
  }
  if (formData.type === AiVideoTypeEnum.MOTION) {
    return !inputUrls.image ? '请上传人物图片' : !inputUrls.video ? '请上传动作视频' : undefined
  }
  if (capability.value.promptRequired && !formData.prompt.trim()) {
    return '请输入提示词'
  }
  if (usesFirstFrame.value && !inputUrls.first_frame) {
    return '请上传首帧图片'
  }
  if (formData.mode === AiVideoModeEnum.FIRST_LAST && !inputUrls.last_frame) {
    return '请上传尾帧图片'
  }
  if (
    formData.mode === AiVideoModeEnum.REFERENCE &&
    !inputUrls.reference_image &&
    !inputUrls.reference_video &&
    !inputUrls.reference_audio
  ) {
    return '请上传参考素材'
  }
  return undefined
}

const handleSubmit = async () => {
  const inputUrls = buildInputUrls()
  const error = validate(inputUrls)
  if (error) {
    message.warning(error)
    return
  }
  submitting.value = true
  try {
    await VideoApi.generateVideo({
      type: formData.type,
      mode: formData.type === AiVideoTypeEnum.GENERATE ? formData.mode : undefined,
      modelId: formData.modelId!,
      prompt: formData.type === AiVideoTypeEnum.MOTION ? undefined : formData.prompt,
      resolution: formData.resolution,
      ratio: formData.ratio,
      duration: formData.duration,
      options: buildOptions(),
      inputUrls
    })
    message.success('任务已提交，生成完成后会出现在我的作品中')
    emit('submitted')
  } finally {
    submitting.value = false
  }
}

// ========== 做同款 ==========

/** 做同款：带回类型、模型、生成方式、提示词与参数，不带回输入文件；不再可选的参数重置为默认值 */
const applySame = (video: VideoVO) => {
  formData.type = video.type
  const model = allModels.value.find((item) => item.id === video.modelId)
  if (model) {
    formData.modelId = model.id
  } else {
    handleTypeChange()
    message.warning('原模型已不可用，已切换为其它模型')
  }
  handleModelChange()
  if (video.mode && capability.value.modes.includes(video.mode)) {
    formData.mode = video.mode
  }
  formData.prompt = video.prompt || ''
  if (model) {
    formData.resolution = video.resolution
    formData.ratio = video.ratio
    formData.duration = video.duration
    options.value = { ...video.options }
  }
  handleModeChange()
  inputs.first_frame = ''
  inputs.last_frame = ''
  inputs.reference_image = []
  inputs.reference_video = ''
  inputs.reference_audio = ''
  inputs.image = ''
  inputs.audio = ''
  inputs.video = ''
}
defineExpose({ applySame })

/** 初始化：加载视频模型 */
onMounted(async () => {
  allModels.value = await ModelApi.getModelSimpleList(AiModelTypeEnum.VIDEO)
  handleTypeChange()
})
</script>
