<!-- AI 语音：合成面板 -->
<template>
  <ContentWrap
    class="h-full"
    :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
  >
    <!-- 表单区域内部滚动，底部「生成语音」按钮固定可见 -->
    <div class="mb-12px text-16px font-bold">语音合成</div>
    <el-skeleton v-if="modelLoading" :rows="6" animated />
    <el-empty
      v-else-if="models.length === 0"
      description="暂无可用的语音模型，请在「AI 模型」中添加类型为「音频」的模型，并配置对应平台的密钥"
    />
    <el-form
      v-else
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      class="min-h-0 flex-1 overflow-y-auto"
    >
      <el-form-item label="模型" prop="modelId">
        <el-select v-model="formData.modelId" placeholder="请选择模型" @change="handleModelChange">
          <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id">
            <span>{{ item.name }}</span>
            <span class="float-right text-12px text-[var(--el-text-color-secondary)]">
              {{ getDictLabel(DICT_TYPE.AI_PLATFORM, item.platform) || item.platform }}
            </span>
          </el-option>
        </el-select>
        <div
          v-if="currentModel?.async"
          class="mt-4px text-12px leading-18px text-[var(--el-text-color-secondary)]"
        >
          长文本异步合成：提交后排队生成，通常数分钟内完成，结果保留 24 小时内可查询
        </div>
      </el-form-item>

      <el-form-item label="朗读文本" prop="inputText">
        <el-input
          v-model="formData.inputText"
          type="textarea"
          :rows="8"
          resize="vertical"
          placeholder="请输入要朗读的文本"
        />
        <div
          class="mt-4px w-full text-right text-12px"
          :class="
            textOverflow ? 'text-[var(--el-color-danger)]' : 'text-[var(--el-text-color-secondary)]'
          "
        >
          {{ textLength }} / {{ currentModel?.maxTextLength ?? '-' }}
          {{ currentModel?.textUnit === SPEECH_TEXT_UNIT_GBK ? 'GBK 字节（估算）' : '字' }}
        </div>
      </el-form-item>

      <el-form-item label="音色" prop="voice">
        <el-select
          v-model="formData.voice"
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入音色"
        >
          <el-option
            v-for="item in currentModel?.voices || []"
            :key="item.value"
            :label="`${item.name}（${item.value}）`"
            :value="item.value"
          />
        </el-select>
        <div class="mt-4px text-12px leading-18px text-[var(--el-text-color-secondary)]">
          可输入服务商的其它音色{{ currentModel?.async ? '，腾讯云为数字 VoiceType' : '' }}
        </div>
      </el-form-item>

      <el-form-item label="音频格式" prop="format">
        <el-radio-group v-model="formData.format">
          <el-radio-button v-for="item in currentModel?.formats || []" :key="item" :value="item">
            {{ getSpeechFormatLabel(item) }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="语速" prop="speed">
        <div class="w-full flex items-center gap-12px">
          <el-slider
            v-model="formData.speed"
            :min="minSpeed"
            :max="maxSpeed"
            :step="0.1"
            :disabled="speedFixed"
            :show-tooltip="false"
            class="flex-1"
          />
          <el-input-number
            v-model="formData.speed"
            :min="minSpeed"
            :max="maxSpeed"
            :step="0.1"
            :precision="2"
            :disabled="speedFixed"
            controls-position="right"
            class="!w-110px"
          />
        </div>
        <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          {{ speedFixed ? '该模型不支持调节语速' : `范围 ${minSpeed} ~ ${maxSpeed} 倍` }}
        </div>
      </el-form-item>
    </el-form>
    <el-button
      v-if="!modelLoading && models.length > 0"
      type="primary"
      class="mt-12px w-full flex-shrink-0"
      :loading="submitting"
      :disabled="textOverflow"
      @click="submit"
    >
      <Icon icon="ep:microphone" class="mr-4px" /> 生成语音
    </el-button>
  </ContentWrap>
</template>

<script setup lang="ts">
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { SpeechApi, SpeechVO } from '@/api/ai/speech'
import {
  getSpeechFormatLabel,
  getSpeechTextLength,
  SPEECH_TEXT_UNIT_GBK,
  SpeechModel
} from '@/views/ai/utils/speech'

/** AI 语音：合成面板 */
defineOptions({ name: 'AiSpeechCreatePanel' })

const props = defineProps<{
  models: SpeechModel[] // 可用的语音模型
  modelLoading: boolean // 模型加载中
}>()

const emit = defineEmits<{
  submitted: [id: number] // 提交成功
}>()

const message = useMessage() // 消息弹窗

const formRef = ref()
const submitting = ref(false)
const formData = ref({
  modelId: undefined as number | undefined,
  inputText: '',
  voice: '',
  format: '',
  speed: 1 // 语速：输入框清空时为 null，提交时按 1
})
const formRules = reactive({
  modelId: [{ required: true, message: '模型不能为空', trigger: 'change' }],
  inputText: [{ required: true, whitespace: true, message: '朗读文本不能为空', trigger: 'blur' }],
  voice: [
    { required: true, whitespace: true, message: '音色不能为空', trigger: 'change' },
    { max: 64, message: '音色不能超过 64 个字符', trigger: 'change' }
  ],
  format: [{ required: true, message: '音频格式不能为空', trigger: 'change' }]
})

const currentModel = computed(() => props.models.find((item) => item.id === formData.value.modelId))
const minSpeed = computed(() => Number(currentModel.value?.minSpeed ?? 1))
const maxSpeed = computed(() => Number(currentModel.value?.maxSpeed ?? 1))
const speedFixed = computed(() => minSpeed.value === maxSpeed.value)
const textLength = computed(() =>
  getSpeechTextLength(formData.value.inputText, currentModel.value?.textUnit)
)
const textOverflow = computed(
  () => !!currentModel.value && textLength.value > currentModel.value.maxTextLength
)

/**
 * 切换模型：音色、格式不在新模型的可选范围时，换为默认值；语速超出范围时重置为 1（不在范围内时取最近的边界）
 *
 * @param keep 尽量保留的参数（再次生成时带入）
 */
const applyModel = (keep?: { voice?: string; format?: string; speed?: number }) => {
  const model = currentModel.value
  if (!model) {
    return
  }
  const voice = keep?.voice ?? formData.value.voice
  const keepVoice = !!keep?.voice || model.voices.some((item) => item.value === voice)
  formData.value.voice = keepVoice ? voice : model.voices[0]?.value || ''
  const format = keep?.format ?? formData.value.format
  formData.value.format = model.formats.includes(format) ? format : model.formats[0]
  const speed = keep?.speed ?? formData.value.speed ?? 1
  formData.value.speed = Math.min(Math.max(speed, minSpeed.value), maxSpeed.value)
}

const handleModelChange = () => {
  applyModel()
  formRef.value?.clearValidate()
}

/** 模型加载后：默认选中第一个；当前模型已不可用时也换为第一个 */
watch(
  () => props.models,
  (models) => {
    if (models.length > 0 && !currentModel.value) {
      formData.value.modelId = models[0].id
      applyModel()
    }
  },
  { immediate: true }
)

/** 提交 */
const submit = async () => {
  if (!(await formRef.value?.validate().catch(() => false))) {
    return
  }
  if (textOverflow.value) {
    message.warning('朗读文本超过模型的上限，请缩短后再试')
    return
  }
  submitting.value = true
  try {
    const id = await SpeechApi.generateSpeech({
      modelId: formData.value.modelId!,
      inputText: formData.value.inputText,
      voice: formData.value.voice.trim(),
      format: formData.value.format,
      speed: speedFixed.value ? undefined : Number((formData.value.speed ?? 1).toFixed(2))
    })
    message.success('已提交，生成完成后可在「我的语音」中播放')
    emit('submitted', id)
  } finally {
    submitting.value = false
  }
}

/** 再次生成：带入文本、音色、格式、语速；原模型已不可用时保留当前模型 */
const fill = (speech: SpeechVO) => {
  const available = props.models.some((item) => item.id === speech.modelId)
  if (available) {
    formData.value.modelId = speech.modelId
  } else {
    message.warning('原模型已不可用，已保留当前模型')
  }
  formData.value.inputText = speech.inputText
  applyModel(
    available ? { voice: speech.voice, format: speech.format, speed: speech.speed } : undefined
  )
  formRef.value?.clearValidate()
}
defineExpose({ fill })
</script>
