<template>
  <div ref="containerRef" :class="getClass" :style="getWrapperStyle">
    <img
      v-show="false"
      ref="imgElRef"
      :alt="alt"
      :crossorigin="crossorigin"
      :src="src"
    />
  </div>
</template>
<script lang="ts" setup>
import { CSSProperties, PropType } from 'vue'
import Cropper from 'cropperjs'
import { useDesign } from '@/hooks/web/useDesign'
import { propTypes } from '@/utils/propTypes'
import { useDebounceFn } from '@vueuse/core'

defineOptions({ name: 'Cropper' })

const props = defineProps({
  src: propTypes.string.def(''),
  alt: propTypes.string.def(''),
  circled: propTypes.bool.def(false),
  realTimePreview: propTypes.bool.def(true),
  height: propTypes.string.def('360px'),
  crossorigin: {
    type: String as PropType<'' | 'anonymous' | 'use-credentials' | undefined>,
    default: undefined
  },
  imageStyle: { type: Object as PropType<CSSProperties>, default: () => ({}) },
  options: { type: Object as PropType<Record<string, any>>, default: () => ({}) }
})

const emit = defineEmits(['cropend', 'ready', 'cropendError'])
const attrs = useAttrs()
const imgElRef = ref<HTMLImageElement>()
const containerRef = ref<HTMLElement>()
const cropper = ref<Cropper>()

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('cropper-image')
const debounceRealTimeCroppered = useDebounceFn(realTimeCroppered, 80)

const getClass = computed(() => {
  return [prefixCls, attrs.class]
})
const getWrapperStyle = computed((): CSSProperties => {
  return { height: `${props.height}`.replace(/px/, '') + 'px' }
})

onMounted(init)

onUnmounted(() => {
  cropper.value?.destroy()
})

async function init() {
  const imgEl = unref(imgElRef)
  const containerEl = unref(containerRef)
  if (!imgEl || !containerEl) return

  cropper.value = new Cropper(imgEl, {
    container: containerEl,
    ...props.options
  })

  // Wait for custom elements to be ready, then configure
  await nextTick()
  const cropperSelection = cropper.value.getCropperSelection()
  const cropperImage = cropper.value.getCropperImage()

  if (cropperSelection) {
    cropperSelection.initialCoverage = 0.5
    cropperSelection.aspectRatio = 1
    cropperSelection.movable = true
    cropperSelection.resizable = true
    cropperSelection.addEventListener('change', () => {
      debounceRealTimeCroppered()
    })
  }

  if (cropperImage) {
    cropperImage.addEventListener('transform', () => {
      debounceRealTimeCroppered()
    })
    // Emit ready once image loads
    cropperImage.addEventListener('load', () => {
      emit('ready', cropper.value)
      realTimeCroppered()
    })
  }
}

// Real-time display preview
function realTimeCroppered() {
  props.realTimePreview && croppered()
}

// event: return base64 and width and height information after cropping
async function croppered() {
  if (!cropper.value) return

  const selection = cropper.value.getCropperSelection()
  if (!selection) return

  const imgInfo = { x: selection.x, y: selection.y, width: selection.width, height: selection.height }

  try {
    let canvas = await selection.$toCanvas()
    if (props.circled) {
      canvas = getRoundedCanvas(canvas)
    }
    canvas.toBlob((blob) => {
      if (!blob) return
      const fileReader = new FileReader()
      fileReader.readAsDataURL(blob)
      fileReader.onloadend = (e) => {
        emit('cropend', {
          imgBase64: e.target?.result ?? '',
          imgInfo
        })
      }
      fileReader.onerror = () => {
        emit('cropendError')
      }
    }, 'image/png')
  } catch {
    // Selection may not be ready yet
  }
}

// Get a circular picture canvas
function getRoundedCanvas(sourceCanvas: HTMLCanvasElement) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  const width = sourceCanvas.width
  const height = sourceCanvas.height
  canvas.width = width
  canvas.height = height
  context.imageSmoothingEnabled = true
  context.drawImage(sourceCanvas, 0, 0, width, height)
  context.globalCompositeOperation = 'destination-in'
  context.beginPath()
  context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true)
  context.fill()
  return canvas
}
</script>
