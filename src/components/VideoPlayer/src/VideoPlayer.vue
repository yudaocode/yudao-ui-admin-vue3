<script setup lang="ts">
import Player from 'xgplayer'
import { ref, unref, onMounted, watch, onBeforeUnmount } from 'vue'
import 'xgplayer/dist/index.min.css'

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  }
})

const playerRef = ref<Player>()

const videoEl = ref<HTMLDivElement>()

const intiPlayer = () => {
  if (!unref(videoEl)) return
  playerRef.value = new Player({
    autoplay: false,
    ...props,
    el: unref(videoEl)
  })
}

onMounted(() => {
  intiPlayer()
})

// setConfig 只更新配置，不会切换实际视频源 / 封面，所以变化时再显式设置 player.src / player.poster
watch(
  () => props.url,
  (url) => {
    const player = unref(playerRef)
    if (!player) return
    player.setConfig({ url })
    player.src = url
  }
)

watch(
  () => props.poster,
  (poster) => {
    const player = unref(playerRef)
    if (!player) return
    player.setConfig({ poster })
    player.poster = poster
  }
)

// 销毁后清空引用，之后的回调不会再访问已销毁的播放器
onBeforeUnmount(() => {
  unref(playerRef)?.destroy()
  playerRef.value = undefined
})

defineExpose({
  playerExpose: () => unref(playerRef)
})
</script>

<template>
  <div ref="videoEl"></div>
</template>
