<template>
  <div
    class="flex items-center justify-between px-2 h-72px bg-[var(--el-bg-color-overlay)] b-solid b-1 b-[var(--el-border-color)] b-l-none"
  >
    <!-- 歌曲信息 -->
    <div class="flex gap-[10px]">
      <el-image
        src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
        class="w-[45px]"
      />
      <div>
        <div>{{ currentSong.title || '暂无音乐' }}</div>
        <div class="text-[12px] text-gray-400">{{ currentSong.singer || currentSong.desc }}</div>
      </div>
    </div>

    <!-- 音频controls -->
    <div class="flex gap-[12px] items-center">
      <Icon icon="majesticons:back-circle" :size="20" class="text-gray-300 cursor-pointer" />
      <Icon
        :icon="audioProps.paused ? 'mdi:arrow-right-drop-circle' : 'solar:pause-circle-bold'"
        :size="30"
        class="cursor-pointer"
        @click="toggleStatus('paused')"
      />
      <Icon icon="majesticons:next-circle" :size="20" class="text-gray-300 cursor-pointer" />
      <div class="flex gap-[16px] items-center">
        <span>{{ audioProps.currentTime }}</span>
        <el-slider
          v-model="audioProgress"
          :max="audioDuration"
          color="#409eff"
          class="w-[160px!important]"
          @change="handleProgressChange"
        />
        <span>{{ audioProps.duration }}</span>
      </div>
      <!-- 音频 -->
      <audio
        :src="currentAudioUrl"
        :autoplay="audioProps.autoplay"
        :muted="audioProps.muted"
        ref="audioRef"
        controls
        v-show="!audioProps"
        @timeupdate="audioTimeUpdate"
        @loadedmetadata="audioLoadedMetadata"
      ></audio>
    </div>

    <!-- 音量控制器 -->
    <div class="flex gap-[16px] items-center">
      <Icon
        :icon="audioProps.muted ? 'tabler:volume-off' : 'tabler:volume'"
        :size="20"
        class="cursor-pointer"
        @click="toggleStatus('muted')"
      />
      <el-slider v-model="audioProps.volume" color="#409eff" class="w-[160px!important]" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import audioUrl from '@/assets/audio/response.mp3'
import { currentSongKey, type MusicSong } from '../types'

defineOptions({ name: 'Index' })

const currentSong = inject(currentSongKey, ref<MusicSong>({}))
const currentAudioUrl = computed(() => currentSong.value.audioUrl || audioUrl)

const audioRef = ref<Nullable<HTMLAudioElement>>(null)
const audioProgress = ref(0)
const audioDuration = ref(0)
// 音频相关属性https://www.runoob.com/tags/ref-av-dom.html
const audioProps = reactive({
  autoplay: true,
  paused: false,
  currentTime: '00:00',
  duration: '00:00',
  muted: false,
  volume: 50
})

const formatAudioTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) {
    return '00:00'
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

function toggleStatus(type: string) {
  audioProps[type] = !audioProps[type]
  if (type === 'paused' && audioRef.value) {
    if (audioProps[type]) {
      audioRef.value.pause()
    } else {
      audioRef.value.play()
    }
  }
}

// 更新播放位置
function audioTimeUpdate() {
  if (!audioRef.value) {
    return
  }
  audioProgress.value = audioRef.value.currentTime
  audioProps.currentTime = formatAudioTime(audioRef.value.currentTime)
}

function audioLoadedMetadata() {
  if (!audioRef.value) {
    return
  }
  audioDuration.value = audioRef.value.duration
  audioProps.duration = formatAudioTime(audioRef.value.duration)
}

function handleProgressChange(value: number | number[]) {
  if (!audioRef.value || Array.isArray(value)) {
    return
  }
  audioRef.value.currentTime = value
  audioProgress.value = value
  audioProps.currentTime = formatAudioTime(value)
}

watch(currentAudioUrl, () => {
  audioProgress.value = 0
  audioDuration.value = 0
  audioProps.currentTime = '00:00'
  audioProps.duration = '00:00'
  nextTick(() => {
    audioRef.value?.load()
  })
})
</script>
