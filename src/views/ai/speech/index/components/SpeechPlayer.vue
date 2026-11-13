<!-- AI 语音：底部播放器 -->
<template>
  <div
    v-show="current"
    class="flex items-center gap-16px border-t border-t-solid border-t-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] px-16px py-10px"
  >
    <!-- 当前语音 -->
    <div class="w-260px flex flex-shrink-0 items-center gap-10px overflow-hidden">
      <div
        class="h-40px w-40px flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--el-fill-color)]"
      >
        <Icon icon="ep:microphone" />
      </div>
      <div class="min-w-0">
        <div class="truncate font-bold" :title="current?.inputText">{{ current?.inputText }}</div>
        <div class="truncate text-12px text-[var(--el-text-color-secondary)]">
          {{ current?.model }} · {{ current?.voice }}
        </div>
      </div>
    </div>

    <!-- 控制 -->
    <el-button circle type="primary" @click="togglePlay">
      <Icon :icon="playing ? 'ep:video-pause' : 'ep:video-play'" />
    </el-button>

    <!-- 进度 -->
    <div class="min-w-0 flex flex-1 items-center gap-10px">
      <span class="w-44px text-right text-12px text-[var(--el-text-color-secondary)]">
        {{ formatMusicDuration(currentTime) }}
      </span>
      <el-slider
        v-model="sliderValue"
        :max="duration || 0"
        :step="0.1"
        :show-tooltip="false"
        :disabled="!duration"
        class="flex-1"
        @input="seeking = true"
        @change="handleSeek"
      />
      <span class="w-44px text-12px text-[var(--el-text-color-secondary)]">
        {{ duration ? formatMusicDuration(duration) : '-' }}
      </span>
    </div>

    <el-button link :disabled="!current" @click="current && downloadSpeech(current)">
      <Icon icon="ep:download" />
    </el-button>
    <el-button link @click="close">
      <Icon icon="ep:close" />
    </el-button>

    <audio
      ref="audioRef"
      class="hidden"
      preload="metadata"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoaded"
      @durationchange="handleLoaded"
      @ended="handleEnded"
      @error="handleError"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { SpeechVO } from '@/api/ai/speech'
import { formatMusicDuration } from '@/views/ai/utils/utils'
import { downloadSpeech } from '@/views/ai/utils/speech'

/** AI 语音：底部播放器；只在用户点击时播放，不自动播放、不自动连播 */
defineOptions({ name: 'AiSpeechPlayer' })

const emit = defineEmits<{
  change: [state: { id?: number; playing: boolean }] // 当前语音、播放状态变化
}>()

const message = useMessage() // 消息弹窗

const audioRef = ref<HTMLAudioElement>()
const current = ref<SpeechVO>() // 当前语音
const playing = ref(false) // 是否播放中
const currentTime = ref(0) // 当前进度（秒）
const duration = ref(0) // 总时长（秒）
const sliderValue = ref(0) // 进度条的值；拖动时不跟随播放进度
const seeking = ref(false) // 是否拖动中

watch([() => current.value?.id, playing], ([id, value]) => emit('change', { id, playing: value }))

/**
 * 播放：同一条则切换播放 / 暂停；其它语音从头播放
 *
 * @param speech 语音
 */
const play = (speech: SpeechVO) => {
  if (current.value?.id === speech.id && current.value.audioUrl === speech.audioUrl) {
    togglePlay()
    return
  }
  const audio = audioRef.value
  if (!audio || !speech.audioUrl) {
    return
  }
  current.value = speech
  currentTime.value = 0
  sliderValue.value = 0
  duration.value = 0
  audio.src = speech.audioUrl
  audio.play().catch(() => message.error('音频加载失败，请稍后重试或下载后播放'))
}

const togglePlay = () => {
  const audio = audioRef.value
  if (!audio || !current.value) {
    return
  }
  if (audio.paused) {
    audio.play().catch(() => message.error('音频加载失败，请稍后重试或下载后播放'))
  } else {
    audio.pause()
  }
}

const handleTimeUpdate = () => {
  currentTime.value = audioRef.value?.currentTime || 0
  if (!seeking.value) {
    sliderValue.value = currentTime.value
  }
}

const handleLoaded = () => {
  const value = audioRef.value?.duration
  if (value && Number.isFinite(value)) {
    duration.value = value
  }
}

const handleSeek = (value: number | number[]) => {
  seeking.value = false
  if (audioRef.value) {
    audioRef.value.currentTime = Array.isArray(value) ? value[0] : value
  }
}

/** 播放结束：回到开头，不自动播放下一条 */
const handleEnded = () => {
  currentTime.value = 0
  sliderValue.value = 0
  if (audioRef.value) {
    audioRef.value.currentTime = 0
  }
}

const handleError = () => {
  if (current.value && audioRef.value?.getAttribute('src')) {
    message.error('音频加载失败，请稍后重试或下载后播放')
  }
}

/** 关闭播放器 */
const close = () => {
  const audio = audioRef.value
  if (audio) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  current.value = undefined
  playing.value = false
}

defineExpose({ play, close })

onBeforeUnmount(() => audioRef.value?.pause())
onDeactivated(() => audioRef.value?.pause())
</script>
