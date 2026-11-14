<!-- AI 语音识别：音频转文字工作台 -->
<template>
  <!-- 高度占满可视区域（与 AI 图片识别一致）：左侧输入、右侧识别结果 -->
  <div
    class="h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-content-padding)-var(--app-content-padding))] flex flex-col overflow-hidden"
  >
    <doc-alert title="AI 语音识别" url="https://doc.iocoder.cn/ai/asr/" />
    <div class="min-h-0 flex flex-1 gap-16px">
      <!-- 左：输入（识别模型、音频、开始识别） -->
      <ContentWrap
        class="h-full w-460px flex-shrink-0 !mb-0"
        :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
      >
        <div class="mb-16px flex items-center justify-between gap-8px">
          <span class="whitespace-nowrap text-16px font-bold">AI 语音识别</span>
          <el-link type="primary" :underline="false" @click="historyRef?.open()">
            <Icon icon="ep:clock" class="mr-4px" /> 识别记录
          </el-link>
        </div>

        <div class="mb-8px whitespace-nowrap text-14px">
          <span class="mr-4px text-[var(--el-color-danger)]">*</span>识别模型
        </div>
        <el-select
          v-model="modelId"
          placeholder="请选择识别模型"
          class="mb-16px !w-full"
          :loading="modelLoading"
          :disabled="recording || recognizing"
          no-data-text="暂无可用的语音识别模型，请联系管理员配置"
        >
          <el-option v-for="model in models" :key="model.id" :label="model.name" :value="model.id">
            <div class="flex items-center justify-between gap-12px">
              <span>{{ model.name }}</span>
              <span class="text-12px text-[var(--el-text-color-secondary)]">
                {{ getDictLabel(DICT_TYPE.AI_PLATFORM, model.platform) || model.platform }}
              </span>
            </div>
          </el-option>
        </el-select>

        <div class="mb-8px flex items-center justify-between text-14px">
          <span><span class="mr-4px text-[var(--el-color-danger)]">*</span>音频</span>
          <span class="text-12px text-[var(--el-text-color-secondary)]">
            当前模型最长 {{ maxSeconds }} 秒
          </span>
        </div>
        <!-- 选择音频：识别时才上传 -->
        <el-upload
          drag
          action="#"
          accept="audio/*"
          :auto-upload="false"
          :show-file-list="false"
          :disabled="recording || recognizing"
          :on-change="handleUploadChange"
        >
          <Icon
            icon="ep:upload-filled"
            :size="40"
            class="text-[var(--el-text-color-placeholder)]"
          />
          <div class="el-upload__text">拖拽音频到这里，或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              支持 mp3、wav、m4a 等常见格式，识别时在浏览器转为 16k WAV 后上传
            </div>
          </template>
        </el-upload>
        <!-- 录音 -->
        <el-button
          class="mt-12px !w-full"
          :type="recording ? 'danger' : undefined"
          :disabled="recognizing || !modelId"
          @click="handleRecord"
        >
          <Icon :icon="recording ? 'ep:video-pause' : 'ep:microphone'" class="mr-4px" />
          {{ recording ? `停止录音（${recordSeconds} / ${maxSeconds} 秒）` : '开始录音' }}
        </el-button>
        <!-- 音频预览：本地音频优先，否则使用记录的音频地址 -->
        <div v-if="audioSrc" class="mt-12px">
          <div class="mb-4px truncate text-12px text-[var(--el-text-color-secondary)]">
            {{ audioName }}
          </div>
          <audio :src="audioSrc" controls class="w-full"></audio>
        </div>

        <div class="flex-1"></div>
        <el-button
          type="primary"
          size="large"
          class="mt-16px !w-full"
          :loading="recognizing"
          :disabled="!audio || !modelId || recording"
          @click="recognize"
        >
          {{ recognizing ? '识别中' : record || requestError ? '重新识别' : '开始识别' }}
        </el-button>
      </ContentWrap>

      <!-- 右：识别结果 -->
      <ContentWrap
        class="h-full min-w-0 flex-1 !mb-0"
        :body-style="{ height: '100%', display: 'flex', flexDirection: 'column' }"
      >
        <!-- 标题、识别模型与耗时；识别成功时右侧为复制、下载 -->
        <div class="mb-12px min-w-0 flex items-center justify-between gap-8px">
          <div class="min-w-0 flex items-center gap-8px">
            <span class="whitespace-nowrap text-16px font-bold">识别结果</span>
            <span
              v-if="phase === 'success'"
              class="truncate text-12px text-[var(--el-text-color-secondary)]"
            >
              {{ resultMeta }}
            </span>
          </div>
          <div v-if="phase === 'success'" class="flex flex-wrap items-center gap-8px">
            <el-button size="small" @click="handleCopy">
              <Icon icon="ep:document-copy" class="mr-4px" /> 复制
            </el-button>
            <el-button size="small" @click="handleDownload">
              <Icon icon="ep:download" class="mr-4px" /> 下载 TXT
            </el-button>
          </div>
        </div>

        <div class="min-h-0 flex flex-1 flex-col">
          <!-- 空状态 -->
          <el-empty
            v-if="phase === 'empty'"
            class="h-full"
            description="在左侧选择识别模型，上传音频或录音后，点击「开始识别」"
          />
          <!-- 待识别：识别按钮统一在左侧底部 -->
          <el-empty
            v-else-if="phase === 'ready'"
            class="h-full"
            :description="audio ? '音频已就绪，点击左侧「开始识别」' : '请在左侧重新上传音频或录音后再识别'"
          />
          <!-- 识别中 -->
          <div
            v-else-if="phase === 'recognizing'"
            class="h-full flex flex-col items-center justify-center gap-12px text-[var(--el-text-color-secondary)]"
          >
            <Icon icon="ep:loading" :size="32" class="is-loading text-[var(--el-color-primary)]" />
            <span>正在识别，请稍候…</span>
          </div>
          <!-- 识别失败：失败原因按纯文本展示 -->
          <el-result v-else-if="phase === 'fail'" icon="error" title="识别失败" class="h-full">
            <template #sub-title>
              <div class="max-w-480px whitespace-pre-wrap break-all text-13px">
                {{ record?.errorMessage || requestError }}
              </div>
            </template>
            <template #extra>
              <el-button v-if="audio" type="primary" :disabled="!modelId" @click="recognize">
                重试
              </el-button>
              <span v-else class="text-13px text-[var(--el-text-color-secondary)]">
                请在左侧重新上传音频或录音
              </span>
            </template>
          </el-result>
          <!-- 识别成功：只展示识别出的原文 -->
          <template v-else>
            <div
              class="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-all border border-[var(--el-border-color)] rounded-4px border-solid p-12px text-14px leading-[1.7]"
            >
              <template v-if="text">{{ text }}</template>
              <span v-else class="text-[var(--el-text-color-placeholder)]">
                音频中没有识别到文字
              </span>
            </div>
            <div
              class="mt-8px flex justify-between text-12px text-[var(--el-text-color-secondary)]"
            >
              <span>共 {{ text.length }} 字</span>
              <span>重新识别会新增一条记录</span>
            </div>
          </template>
        </div>
      </ContentWrap>
    </div>

    <!-- 识别记录 -->
    <AsrHistoryDrawer
      ref="historyRef"
      :current-id="record?.id"
      @open="openRecord"
      @deleted="handleDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import type { UploadFile, UploadRequestOptions } from 'element-plus'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { ModelApi, ModelVO } from '@/api/ai/model/model'
import { AsrApi, AsrVO } from '@/api/ai/asr'
import { AiAsrStatusEnum, AiModelTypeEnum } from '@/views/ai/utils/constants'
import { convertToWav, getAsrMaxSeconds, startWavRecorder, WavRecorder } from '@/views/ai/utils/asr'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import AsrHistoryDrawer from './components/AsrHistoryDrawer.vue'

/** AI 语音识别：音频转文字工作台 */
defineOptions({ name: 'AiAsr' })

const message = useMessage() // 消息弹窗

const historyRef = ref<InstanceType<typeof AsrHistoryDrawer>>()

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 选择音频的最大字节数：在浏览器解码，避免过大

// ========== 识别模型 ==========

const modelLoading = ref(false)
const models = ref<ModelVO[]>([]) // 可用的语音识别模型
const modelId = ref<number>()
const model = computed(() => models.value.find((item) => item.id === modelId.value))
const maxSeconds = computed(() => getAsrMaxSeconds(model.value?.platform)) // 当前模型的最长音频时长

const getModelList = async () => {
  modelLoading.value = true
  try {
    models.value = (await ModelApi.getModelSimpleList(AiModelTypeEnum.ASR)) || []
    modelId.value = models.value[0]?.id
  } finally {
    modelLoading.value = false
  }
}

// ========== 工作台状态 ==========

const audio = ref<Blob>() // 当前音频：选择的文件，或录音的 WAV；打开记录后为空，重新识别需要重新选择
const audioName = ref('') // 音频名称，用于展示、下载的文件名
const objectUrl = ref<string>() // 本地预览地址，切换音频时释放
const fileUrl = ref<string>() // 当前音频转 WAV、上传到文件服务后的地址
const record = ref<AsrVO>() // 当前识别记录
const recognizing = ref(false) // 识别中
const requestError = ref<string>() // 请求失败（未生成识别记录）的提示

/** 试听：本地音频优先，否则使用记录的音频地址 */
const audioSrc = computed(() => objectUrl.value || record.value?.audioUrl)

/** 当前阶段 */
const phase = computed(() => {
  if (recognizing.value) {
    return 'recognizing'
  }
  if (record.value) {
    return record.value.status === AiAsrStatusEnum.SUCCESS ? 'success' : 'fail'
  }
  if (requestError.value) {
    return 'fail'
  }
  return audioSrc.value ? 'ready' : 'empty'
})

/** 识别结果：识别出的原文 */
const text = computed(() => record.value?.originalText ?? '')
/** 结果说明：识别模型、耗时 */
const resultMeta = computed(() => {
  const current = record.value
  if (!current) {
    return ''
  }
  const duration = current.duration ? ` · ${(current.duration / 1000).toFixed(1)} 秒` : ''
  return `${current.modelName || ''}${duration}`
})
/** 释放本地预览地址 */
const revokeObjectUrl = () => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = undefined
  }
}

/** 重置结果区 */
const resetResult = () => {
  recognizing.value = false
  record.value = undefined
  requestError.value = undefined
}

/** 切换音频：清空上一次的识别结果 */
const setAudio = (blob: Blob, name: string) => {
  resetResult()
  revokeObjectUrl()
  audio.value = blob
  audioName.value = name
  objectUrl.value = URL.createObjectURL(blob)
  fileUrl.value = undefined
}

/** 切换模型：各模型的时长上限不同，重新识别时重新转换、上传 */
watch(modelId, () => {
  fileUrl.value = undefined
})

// ========== 选择音频 ==========

const handleUploadChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (!file) {
    return
  }
  if (
    !file.type.startsWith('audio/') &&
    !/\.(mp3|wav|m4a|aac|ogg|opus|webm|flac)$/i.test(file.name)
  ) {
    message.warning('请选择音频文件')
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    message.warning('音频文件不能超过 50 MB')
    return
  }
  setAudio(file, file.name)
}

// ========== 录音 ==========

const recording = ref(false) // 是否正在录音
const recordSeconds = ref(0) // 已录音的秒数
let recorder: WavRecorder | undefined
let recordTimer: any // 计时，达到最长时长后自动停止

/** 点击录音：未录音时开始，录音中时停止 */
const handleRecord = async () => {
  if (recording.value) {
    await stopRecord()
    return
  }
  const limit = maxSeconds.value
  try {
    recorder = await startWavRecorder(limit)
  } catch {
    message.error('无法使用麦克风，请检查浏览器的麦克风权限')
    return
  }
  recording.value = true
  recordSeconds.value = 0
  recordTimer = setInterval(() => {
    recordSeconds.value++
    if (recordSeconds.value >= limit) {
      stopRecord()
    }
  }, 1000)
}

/** 停止录音：录音转为 WAV 后作为当前音频，不自动识别 */
const stopRecord = async () => {
  clearInterval(recordTimer)
  const current = recorder
  if (!current) {
    return
  }
  recorder = undefined
  recording.value = false
  try {
    setAudio(await current.stop(), `录音-${formatDate(new Date(), 'YYYYMMDDHHmmss')}.wav`)
  } catch {
    message.error('录音处理失败，请重新录音')
  }
}

// ========== 识别 ==========

/** 上传音频到文件服务：与其它模块一致，复用上传组件的逻辑（支持前端直传、后端上传） */
const { httpRequest: uploadFile } = useUpload()
const uploadAudio = async (wav: Blob): Promise<string> => {
  const name = `${(audioName.value || 'asr').replace(/\.[^.]+$/, '')}.wav`
  const file = new File([wav], name, { type: 'audio/wav' })
  const res: any = await uploadFile({ file, filename: 'file' } as UploadRequestOptions)
  return res.data
}

const recognize = async () => {
  if (!audio.value || !model.value) {
    return
  }
  const currentAudio = audio.value
  const currentModel = model.value
  resetResult()
  recognizing.value = true
  try {
    // 1. 先转为 16k 单声道 WAV 并上传：时长超过当前模型上限时报错；同一段音频重试时，复用已上传的地址
    if (!fileUrl.value) {
      let wav: Blob
      try {
        wav = await convertToWav(currentAudio, maxSeconds.value)
      } catch (e: any) {
        message.error(e?.message || '音频处理失败')
        return
      }
      const url = await uploadAudio(wav)
      if (audio.value !== currentAudio) {
        return
      }
      fileUrl.value = url
    }
    // 2. 识别：成功、失败都会生成一条记录
    const data = await AsrApi.recognizeAsr({ modelId: currentModel.id, fileUrl: fileUrl.value })
    // 识别期间切换了音频或打开了记录，不覆盖当前内容
    if (audio.value !== currentAudio) {
      return
    }
    record.value = data
  } catch {
    if (audio.value === currentAudio) {
      requestError.value = '识别请求失败，请检查音频和识别模型后重试'
    }
  } finally {
    if (audio.value === currentAudio) {
      recognizing.value = false
    }
  }
}

// ========== 复制、下载 ==========

const { copy } = useClipboard({ legacy: true }) // 粘贴板

/** 复制识别结果 */
const handleCopy = async () => {
  try {
    await copy(text.value)
    message.success('复制成功')
  } catch {
    message.error('复制失败，请手动选择文本复制')
  }
}

/** 下载识别结果为 TXT */
const handleDownload = () => {
  const name = (audioName.value || record.value?.fileName || 'asr').replace(/\.[^.]+$/, '')
  const href = URL.createObjectURL(new Blob([text.value], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = href
  link.download = `${name}.txt`
  link.click()
  URL.revokeObjectURL(href)
}

// ========== 识别记录 ==========

/** 打开记录：展示识别结果；没有本地音频，重新识别需要重新上传或录音 */
const openRecord = (item: AsrVO) => {
  if (item.id === record.value?.id) {
    historyRef.value?.close()
    return
  }
  resetResult()
  revokeObjectUrl()
  audio.value = undefined
  fileUrl.value = undefined
  audioName.value = item.fileName
  record.value = item
  historyRef.value?.close()
}

/** 删除的是当前记录时，结果区回到待识别 */
const handleDeleted = (id: number) => {
  if (record.value?.id !== id) {
    return
  }
  resetResult()
  if (!audio.value) {
    audioName.value = ''
  }
}

onMounted(() => {
  getModelList()
})
/** 销毁：放弃进行中的录音，释放麦克风和预览地址 */
onBeforeUnmount(() => {
  clearInterval(recordTimer)
  recorder?.cancel()
  revokeObjectUrl()
})
</script>
