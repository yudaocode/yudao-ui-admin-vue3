<template>
  <!--
    语音录制面板
    - 三态机：idle 未录 / recording 录制中 / preview 试听阶段
    - 录制完成后可试听、重录或发送
    - 需浏览器支持 MediaRecorder（HTTPS 或 localhost）
    - 仅 idle 状态点击外部会关闭，避免录制 / 试听阶段被误关丢内容
  -->
  <div
    v-if="visible"
    ref="rootRef"
    class="im-popover-arrow absolute z-100 w-80 p-4 rounded-md bg-[var(--el-bg-color)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
    @click.stop
  >
    <div class="flex flex-col items-center gap-3">
      <!-- 计时：录制时累加；试听阶段定格在最终时长 -->
      <div class="text-[28px] font-medium tabular-nums text-[var(--el-text-color-primary)]">
        {{ timerText }}
      </div>

      <!-- 状态文案 -->
      <div class="text-13px text-[var(--el-text-color-secondary)]">
        <span v-if="status === 'idle'">点击下方按钮开始录制</span>
        <span v-else-if="status === 'recording'">录制中，最长 {{ maxDuration }} 秒</span>
        <span v-else>录制完成，可试听后发送</span>
      </div>

      <!-- idle / recording 阶段：脉冲圆点；preview 阶段：原生音频播放器 -->
      <div
        v-if="status !== 'preview'"
        class="w-12 h-12 rounded-full bg-[var(--el-border-color)]"
        :class="{ 'im-voice-recorder__pulse bg-[#f56c6c]': status === 'recording' }"
      ></div>
      <audio v-else :src="previewUrl" controls class="w-full"></audio>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-2 mt-3">
      <template v-if="status === 'idle'">
        <el-button size="small" @click="handleCancel">取消</el-button>
        <el-button size="small" type="primary" @click="startRecord">开始录制</el-button>
      </template>
      <template v-else-if="status === 'recording'">
        <el-button size="small" @click="handleCancel">取消</el-button>
        <el-button size="small" type="primary" @click="stopRecord">停止录制</el-button>
      </template>
      <template v-else>
        <el-button size="small" @click="handleCancel">取消</el-button>
        <el-button size="small" @click="restart">重新录制</el-button>
        <el-button size="small" type="primary" @click="handleSend">发送</el-button>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { formatSeconds } from '@/utils/formatTime'

defineOptions({ name: 'ImVoiceRecorder' })

const props = withDefaults(
  defineProps<{
    modelValue: boolean // 是否显示
    maxDuration?: number // 最长录制秒数
  }>(),
  {
    maxDuration: 60
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  send: [payload: { blob: Blob; duration: number; extension: string; mimeType: string }] // 录制完成：返回录音 Blob 和时长（秒）
}>()

const message = useMessage()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const rootRef = useTemplateRef<HTMLDivElement>('rootRef')

/** 录制状态机：未开始 / 录制中 / 完成可试听 */
type Status = 'idle' | 'recording' | 'preview'
const status = ref<Status>('idle')
const duration = ref(0)
const previewUrl = ref('')

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let mediaStream: MediaStream | null = null
let timer: ReturnType<typeof setInterval> | null = null
let recordedBlob: Blob | null = null
let recordedMimeType = ''
let recordedExtension = 'webm'
/** 取消标记：录制中触发 resetAll 时让异步 'stop' 监听器丢弃数据，不进 preview */
let discarding = false

const VOICE_MIME_TYPE_OPTIONS = [
  { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
  { mimeType: 'audio/webm', extension: 'webm' },
  { mimeType: 'audio/mp4', extension: 'm4a' },
  { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' }
]

/** 计时器展示文案：mm:ss */
const timerText = computed(() => formatSeconds(duration.value))

/** 仅在面板可见时挂全局点击监听；关闭时同步重置录制资源 */
watch(visible, (v) => {
  if (v) {
    document.addEventListener('click', handleDocumentClick)
  } else {
    document.removeEventListener('click', handleDocumentClick)
    resetAll()
  }
})

/** 点击面板外部：仅 idle 状态自动关闭，避免录制 / 试听阶段被误关丢数据 */
function handleDocumentClick(e: MouseEvent) {
  if (!props.modelValue || !rootRef.value) {
    return
  }
  if (rootRef.value.contains(e.target as Node)) {
    return
  }
  if (status.value !== 'idle') {
    return
  }
  visible.value = false
}

/** 开始录制：申请麦克风 + 启动 MediaRecorder + 启动每秒计时 */
async function startRecord() {
  if (!navigator.mediaDevices?.getUserMedia) {
    message.error('当前浏览器不支持录音（需要 HTTPS 或 localhost）')
    return
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (e) {
    message.error('无法获取麦克风权限')
    return
  }
  audioChunks = []
  discarding = false
  const voiceMimeType = getSupportedVoiceMimeType()
  if (!voiceMimeType) {
    message.error('当前浏览器不支持录音格式')
    cleanupStream()
    return
  }
  recordedMimeType = voiceMimeType.mimeType
  recordedExtension = voiceMimeType.extension
  mediaRecorder = new MediaRecorder(mediaStream, { mimeType: recordedMimeType })
  mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data)
    }
  })
  mediaRecorder.addEventListener('stop', () => {
    // 中途取消时直接丢弃，不进 preview
    if (discarding) {
      return
    }
    recordedBlob = new Blob(audioChunks, { type: recordedMimeType })
    previewUrl.value = URL.createObjectURL(recordedBlob)
    status.value = 'preview'
  })
  mediaRecorder.start()
  status.value = 'recording'
  duration.value = 0
  timer = setInterval(() => {
    duration.value++
    if (duration.value >= props.maxDuration) {
      stopRecord()
    }
  }, 1000)
}

/** 停止录制：进入 preview 阶段，由用户决定重录或发送；< 1s 视为误触，直接 warning + 回 idle 不进 preview */
function stopRecord() {
  if (duration.value < 1) {
    message.warning('录音时间太短')
    resetAll()
    return
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  cleanupStream()
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** 重新录制：丢掉当前预览，回到 idle 等待再次点击开始 */
function restart() {
  clearPreview()
  duration.value = 0
  status.value = 'idle'
}

/** 发送：把 blob + 时长上抛父级，由父级负责上传 */
function handleSend() {
  if (!recordedBlob) {
    return
  }
  emit('send', {
    blob: recordedBlob,
    duration: duration.value,
    extension: recordedExtension,
    mimeType: recordedMimeType
  })
  visible.value = false
}

/** 取消：关闭面板，watch 内统一走 resetAll */
function handleCancel() {
  visible.value = false
}

/** 全量重置：录制流 / 计时 / 预览资源全部清掉 */
function resetAll() {
  // 标记取消，避免 mediaRecorder.stop() 后异步 'stop' 监听器把状态切到 preview
  discarding = true
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  cleanupStream()
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  audioChunks = []
  recordedMimeType = ''
  recordedExtension = 'webm'
  duration.value = 0
  status.value = 'idle'
  clearPreview()
}

/** 释放预览音频：撤销 ObjectURL 并清空 blob */
function clearPreview() {
  recordedBlob = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

/** 关闭麦克风采集：停止所有 track，浏览器顶栏录音指示熄灭 */
function cleanupStream() {
  mediaStream?.getTracks().forEach((t) => t.stop())
  mediaStream = null
}

/** 查询浏览器支持的录音格式 */
function getSupportedVoiceMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return undefined
  }
  return VOICE_MIME_TYPE_OPTIONS.find((item) => MediaRecorder.isTypeSupported(item.mimeType))
}

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('click', handleDocumentClick)
  }
})

onBeforeUnmount(resetAll)

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped>
/* 底部小三角：指向触发图标，仿微信 PC 气泡指针；left 偏移对应语音按钮（工具栏 4th icon） */
.im-popover-arrow::after {
  position: absolute;
  top: calc(100% - 1px);
  left: 110px;
  border-color: var(--el-bg-color) transparent transparent transparent;
  border-style: solid;
  border-width: 6px 6px 0;
  content: '';
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 8%));
}

/* 录音中的脉冲呼吸动画；@keyframes 必须 CSS 定义 */
.im-voice-recorder__pulse {
  animation: im-voice-pulse 1s infinite;
}

@keyframes im-voice-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(245 108 108 / 60%);
  }

  70% {
    box-shadow: 0 0 0 20px rgb(245 108 108 / 0%);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(245 108 108 / 0%);
  }
}
</style>
