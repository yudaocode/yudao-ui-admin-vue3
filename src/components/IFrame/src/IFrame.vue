<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'IFrame' })

const props = defineProps({
  src: propTypes.string.def('')
})
const loading = ref(true)
const frameRef = ref<HTMLIFrameElement | null>(null)
/** 加载完成：通过模板的 @load 绑定，在 iframe 创建时就注册，不会错过加载事件 */
const handleLoad = () => {
  loading.value = false
}
onBeforeUnmount(() => {
  if (!frameRef.value) return
  frameRef.value.src = 'about:blank'
})
watch(
  () => props.src,
  () => {
    loading.value = true
  }
)
</script>
<template>
  <div
    v-loading="loading"
    class="w-full h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-content-padding)-var(--app-content-padding)-2px)]"
  >
    <iframe
      ref="frameRef"
      :src="props.src"
      @load="handleLoad"
      frameborder="0"
      scrolling="auto"
      height="100%"
      width="100%"
      allowfullscreen="true"
      webkitallowfullscreen="true"
      mozallowfullscreen="true"
    ></iframe>
  </div>
</template>
