<template>
  <!--
    语音录制对话框
    - 简化实现：按下开始录，松开结束录；超过 maxDuration 自动停止
    - 只产出 Blob + 时长，实际上传/消息封装由调用方处理
    - 需要浏览器支持 MediaRecorder（HTTPS 或 localhost）
  -->
  <el-dialog
    v-model="visible"
    title="按住空格说话"
    width="360px"
    :close-on-click-modal="false"
    @close="handleCancel"
  >
    <div class="flex flex-col items-center gap-4 py-5">
      <div class="text-[32px] font-medium tabular-nums text-[var(--el-text-color-primary)]">
        {{ timerText }}
      </div>
      <div class="text-13px text-[var(--el-text-color-secondary)]">
        <span v-if="recording">录制中，松开按钮或按 Esc 取消</span>
        <span v-else>点击"开始录制"后对着麦克风说话</span>
      </div>
      <div
        class="w-12 h-12 rounded-full bg-[var(--el-border-color)]"
        :class="{ 'im-voice-recorder__pulse bg-[#f56c6c]': recording }"
      ></div>
    </div>

    <template #footer>
      <el-button v-if="!recording" @click="handleCancel">取消</el-button>
      <el-button v-if="!recording" type="primary" @click="startRecord">开始录制</el-button>
      <el-button v-else type="danger" @click="stopRecord">停止并发送</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
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
  send: [payload: { blob: Blob; duration: number }] // 录制完成：返回录音 Blob 和时长（秒）
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const recording = ref(false)
const duration = ref(0)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let mediaStream: MediaStream | null = null
let timer: ReturnType<typeof setInterval> | null = null

const timerText = computed(() => formatSeconds(duration.value))

watch(visible, (v) => {
  if (!v) resetAll()
})

async function startRecord() {
  if (!navigator.mediaDevices?.getUserMedia) {
    ElMessage.error('当前浏览器不支持录音（需要 HTTPS 或 localhost）')
    return
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (e) {
    ElMessage.error('无法获取麦克风权限')
    return
  }
  audioChunks = []
  mediaRecorder = new MediaRecorder(mediaStream)
  mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data)
    }
  })
  mediaRecorder.addEventListener('stop', () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' })
    emit('send', { blob, duration: duration.value })
    visible.value = false
  })
  mediaRecorder.start()
  recording.value = true
  duration.value = 0
  timer = setInterval(() => {
    duration.value++
    if (duration.value >= props.maxDuration) {
      stopRecord()
    }
  }, 1000)
}

function stopRecord() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  cleanupStream()
  recording.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function handleCancel() {
  if (recording.value) {
    // 取消时不触发 send 事件
    mediaRecorder?.removeEventListener('stop', onStopSilently)
    mediaRecorder?.addEventListener('stop', onStopSilently, { once: true })
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  }
  resetAll()
  visible.value = false
}

function onStopSilently() {
  // 用户取消：丢弃已录数据，不发送
  audioChunks = []
}

function resetAll() {
  recording.value = false
  duration.value = 0
  audioChunks = []
  cleanupStream()
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function cleanupStream() {
  mediaStream?.getTracks().forEach((t) => t.stop())
  mediaStream = null
}

onBeforeUnmount(resetAll)
</script>

<style scoped>
/* 脉冲呼吸动画：keyframes 在 UnoCSS 原子类里不好表达，保留 scoped */
.im-voice-recorder__pulse {
  animation: im-voice-pulse 1s infinite;
}

@keyframes im-voice-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.6);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(245, 108, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}
</style>
