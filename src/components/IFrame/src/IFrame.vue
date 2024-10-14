<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'IFrame' })

const props = defineProps({
  src: propTypes.string.def('')
})
const loading = ref(true)
const frameRef = ref<HTMLElement | null>(null)
const init = () => {
  nextTick(() => {
    loading.value = true
    if (!frameRef.value) return
    frameRef.value.onload = () => {
      loading.value = false
    }
  })
}
onMounted(() => {
  init()
})
watch(
  () => props.src,
  () => {
    init()
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
