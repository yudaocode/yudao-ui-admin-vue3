<!-- 地图只读预览组件：基于百度地图 GL 展示单个 BD09 坐标点，进入视口时创建、离开视口时移除 -->
<template>
  <div ref="containerRef" class="relative overflow-hidden">
    <iframe
      v-if="visible && previewHtml"
      :key="previewHtml"
      ref="frameRef"
      :srcdoc="previewHtml"
      class="pointer-events-none block h-full w-full border-0"
      tabindex="-1"
      title="地图预览"
    ></iframe>
    <div
      v-if="loadFailed"
      class="absolute inset-0 flex items-center justify-center bg-[var(--el-fill-color-light)] text-12px text-[var(--el-text-color-secondary)]"
    >
      地图加载失败
    </div>
  </div>
</template>

<script lang="ts" setup>
import { BAIDU_MAP_PREVIEW_ERROR, buildBaiduMapPreviewHtml } from './utils'

defineOptions({ name: 'MapView' })

const props = withDefaults(
  defineProps<{
    latitude: number // BD09 纬度
    longitude: number // BD09 经度
    zoom?: number // 缩放级别
  }>(),
  {
    zoom: 15
  }
)

const containerRef = ref<HTMLElement>() // 预览容器
const frameRef = ref<HTMLIFrameElement>() // 预览 iframe
const visible = ref(false) // 是否在视口内
const frameFailed = ref(false) // 预览页面是否上报加载失败
let observer: IntersectionObserver | undefined // 视口观察器

/**
 * 预览页面（iframe srcdoc）
 *
 * 百度 GL SDK 的 destroy 会延迟清空实例，并清理同页其他地图共用的样式与全局状态，仍在排队的瓦片回调随后读取已清空的配置而抛错，
 * 公开 API 没有可等待的完成时机。因此每个预览运行在独立 iframe 中且不调用 destroy，离开视口或坐标变化时移除、重建 iframe
 */
const previewHtml = computed(() =>
  buildBaiduMapPreviewHtml(props.longitude, props.latitude, props.zoom)
)
const loadFailed = computed(() => !previewHtml.value || frameFailed.value)

/** 接收预览页面的加载失败消息，只处理当前 iframe 发出的消息 */
const handleMessage = (event: MessageEvent) => {
  const frameWindow = frameRef.value?.contentWindow
  if (frameWindow && event.source === frameWindow && event.data?.type === BAIDU_MAP_PREVIEW_ERROR) {
    frameFailed.value = true
  }
}

// 重新进入视口或坐标变化时会创建新的预览页面，清除上一次的失败状态
watch([visible, previewHtml], () => {
  frameFailed.value = false
})

onMounted(() => {
  window.addEventListener('message', handleMessage)
  const container = containerRef.value
  if (!container) {
    return
  }
  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        visible.value = entry.isIntersecting
      }
    },
    { rootMargin: '100px' }
  )
  observer.observe(container)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  observer?.disconnect()
  observer = undefined
})
</script>
