<template>
  <div class="flex items-center justify-between px-2 h-72px bg-[var(--el-bg-color-overlay)] b-solid b-1 b-[var(--el-border-color)] b-l-none">
    <!-- 歌曲信息 -->
    <div class="flex gap-[10px]">
      <el-image src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png" class="w-[45px]"/>
      <div>
        <div>{{currentSong.name}}</div>
        <div class="text-[12px] text-gray-400">{{currentSong.singer}}</div>
      </div>
    </div>
      
    <!-- 音频controls -->
    <div class="flex gap-[12px] items-center">
      <Icon icon="majesticons:back-circle" :size="20" class="text-gray-300 cursor-pointer"/>
      <Icon :icon="audioProps.paused ? 'mdi:arrow-right-drop-circle' : 'solar:pause-circle-bold'" :size="30" class=" cursor-pointer" @click="toggleStatus('paused')"/>
      <Icon icon="majesticons:next-circle" :size="20" class="text-gray-300 cursor-pointer"/>
      <div class="flex gap-[16px] items-center">
        <span>{{audioProps.currentTime}}</span>
        <el-slider v-model="audioProps.duration" color="#409eff" class="w-[160px!important] "/>
        <span>{{ audioProps.duration }}</span>
      </div>
      <!-- 音频 -->
      <audio v-bind="audioProps" ref="audioRef" controls v-show="!audioProps" @timeupdate="audioTimeUpdate">
        <source :src="audioUrl"/>
      </audio>
    </div>

    <!-- 音量控制器 -->
    <div class="flex gap-[16px] items-center">
      <Icon :icon="audioProps.muted ? 'tabler:volume-off' : 'tabler:volume'" :size="20" class="cursor-pointer" @click="toggleStatus('muted')"/>
      <el-slider v-model="audioProps.volume" color="#409eff" class="w-[160px!important] "/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatPast } from '@/utils/formatTime'
import audioUrl from '@/assets/audio/response.mp3'

defineOptions({ name: 'Index' })

const currentSong = inject('currentSong', {})

const audioRef = ref<Nullable<HTMLElement>>(null)
  // 音频相关属性https://www.runoob.com/tags/ref-av-dom.html
const audioProps = reactive({
  autoplay: true,
  paused: false,
  currentTime: '00:00',
  duration: '00:00',
  muted:  false,
  volume: 50,
})

function toggleStatus (type: string) {
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
function audioTimeUpdate (args) {
  audioProps.currentTime = formatPast(new Date(args.timeStamp), 'mm:ss')
}
</script>
