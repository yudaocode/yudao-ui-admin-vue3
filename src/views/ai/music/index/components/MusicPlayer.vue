<!-- AI 音乐：底部播放器 -->
<template>
  <div
    v-show="current"
    class="flex items-center gap-16px border-t border-t-solid border-t-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] px-16px py-10px"
  >
    <!-- 当前歌曲 -->
    <div class="w-240px flex flex-shrink-0 items-center gap-10px overflow-hidden">
      <el-image
        :src="current?.coverUrl"
        fit="cover"
        class="h-44px w-44px flex-shrink-0 rounded-4px bg-[var(--el-fill-color)]"
      >
        <template #error>
          <div class="h-full w-full flex items-center justify-center">
            <Icon icon="ep:headset" />
          </div>
        </template>
      </el-image>
      <div class="min-w-0">
        <div class="truncate font-bold">{{ getMusicTitle(current?.title) }}</div>
        <div class="truncate text-12px text-[var(--el-text-color-secondary)]">
          {{ current?.tags || current?.userNickname || '' }}
        </div>
      </div>
    </div>

    <!-- 控制 -->
    <div class="flex flex-shrink-0 items-center gap-6px">
      <el-button circle size="small" :disabled="!hasPrev" @click="playPrev">
        <Icon icon="ep:d-arrow-left" />
      </el-button>
      <el-button circle type="primary" @click="togglePlay">
        <Icon :icon="playing ? 'ep:video-pause' : 'ep:video-play'" />
      </el-button>
      <el-button circle size="small" :disabled="!hasNext" @click="playNext">
        <Icon icon="ep:d-arrow-right" />
      </el-button>
    </div>

    <!-- 进度 -->
    <div class="min-w-0 flex flex-1 items-center gap-10px">
      <span class="w-44px text-right text-12px text-[var(--el-text-color-secondary)]">
        {{ formatMusicDuration(currentTime) }}
      </span>
      <el-slider
        v-model="sliderValue"
        :max="duration || 0"
        :step="1"
        :show-tooltip="false"
        :disabled="!duration"
        class="flex-1"
        @change="handleSeek"
      />
      <span class="w-44px text-12px text-[var(--el-text-color-secondary)]">
        {{ formatMusicDuration(duration || current?.duration) }}
      </span>
    </div>

    <el-button link @click="close">
      <Icon icon="ep:close" />
    </el-button>

    <audio
      ref="audioRef"
      class="hidden"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoaded"
      @ended="handleEnded"
      @error="handleError"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import { MusicApi, MusicVO } from '@/api/ai/music'
import { formatMusicDuration, getMusicTitle } from '@/views/ai/utils/utils'

/** AI 音乐：底部播放器 */
defineOptions({ name: 'AiMusicPlayer' })

const emit = defineEmits<{
  change: [state: { id?: number; playing: boolean }] // 当前歌曲、播放状态变化
}>()

const message = useMessage() // 消息弹窗

const audioRef = ref<HTMLAudioElement>()
const playlist = ref<MusicVO[]>([]) // 播放列表：当前列表中可播放的作品
const current = ref<MusicVO>() // 当前歌曲
const playing = ref(false) // 是否播放中
const currentTime = ref(0) // 当前进度（秒）
const duration = ref(0) // 总时长（秒）
const sliderValue = ref(0) // 进度条的值；拖动时不跟随播放进度
let seeking = false

const currentIndex = computed(() =>
  playlist.value.findIndex((item) => item.id === current.value?.id)
)
const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(
  () => currentIndex.value >= 0 && currentIndex.value < playlist.value.length - 1
)

watch([() => current.value?.id, playing], ([id, value]) => emit('change', { id, playing: value }))

/**
 * 播放：同一首则切换播放 / 暂停；新歌曲从头播放，并记录一次播放
 *
 * @param music 歌曲
 * @param list 播放列表，用于上一首、下一首
 */
const play = (music: MusicVO, list?: MusicVO[]) => {
  if (list) {
    playlist.value = list.filter((item) => !!item.audioUrl)
  }
  if (current.value?.id === music.id) {
    togglePlay()
    return
  }
  start(music)
}

const start = (music: MusicVO) => {
  const audio = audioRef.value
  if (!audio || !music.audioUrl) {
    return
  }
  current.value = music
  currentTime.value = 0
  sliderValue.value = 0
  duration.value = music.duration || 0
  audio.src = music.audioUrl
  audio
    .play()
    .then(() => {
      // 记录播放次数，失败不影响播放
      MusicApi.playMusic(music.id).catch(() => {})
      music.playCount = (music.playCount || 0) + 1
    })
    .catch(() => {})
}

const togglePlay = () => {
  const audio = audioRef.value
  if (!audio || !current.value) {
    return
  }
  if (audio.paused) {
    audio.play().catch(() => message.error('音频加载失败'))
  } else {
    audio.pause()
  }
}

const playPrev = () => {
  if (hasPrev.value) {
    start(playlist.value[currentIndex.value - 1])
  }
}

const playNext = () => {
  if (hasNext.value) {
    start(playlist.value[currentIndex.value + 1])
  }
}

const handleTimeUpdate = () => {
  currentTime.value = audioRef.value?.currentTime || 0
  if (!seeking) {
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
  seeking = false
  if (audioRef.value) {
    audioRef.value.currentTime = Array.isArray(value) ? value[0] : value
  }
}
watch(sliderValue, () => {
  // 拖动中：进度条与播放进度不一致时，暂不跟随
  seeking = Math.abs(sliderValue.value - currentTime.value) > 1
})

const handleEnded = () => {
  if (hasNext.value) {
    playNext()
  }
}

const handleError = () => {
  if (current.value) {
    message.error('音频加载失败')
  }
}

/** 关闭播放器 */
const close = () => {
  audioRef.value?.pause()
  if (audioRef.value) {
    audioRef.value.removeAttribute('src')
    audioRef.value.load()
  }
  current.value = undefined
  playing.value = false
}

defineExpose({ play, close })

onBeforeUnmount(() => audioRef.value?.pause())
onDeactivated(() => audioRef.value?.pause())
</script>
