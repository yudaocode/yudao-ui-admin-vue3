<template>
  <div ref="containerRef" :class="getClass" :style="getWrapperStyle">
    <img v-show="false" ref="imgElRef" :alt="alt" :crossorigin="crossorigin" :src="src" />
  </div>
</template>
<script lang="ts" setup>
import { CSSProperties, PropType } from 'vue'
import Cropper from 'cropperjs'
import { useDesign } from '@/hooks/web/useDesign'
import { useDebounceFn } from '@vueuse/core'

defineOptions({ name: 'Cropper' })

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  circled: { type: Boolean, default: false },
  realTimePreview: { type: Boolean, default: true },
  // 只返回原图坐标、不生成裁剪图片；坐标按未旋转、未斜切的图片换算
  coordinatesOnly: { type: Boolean, default: false },
  aspectRatio: { type: Number, default: 1 },
  transformable: { type: Boolean, default: true },
  height: { type: String, default: '360px' },
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
    cropperSelection.aspectRatio = props.aspectRatio
    cropperSelection.movable = true
    cropperSelection.resizable = true
    cropperSelection.addEventListener('change', () => {
      debounceRealTimeCroppered()
    })
  }

  if (cropperImage) {
    cropperImage.rotatable = props.transformable
    cropperImage.scalable = props.transformable
    cropperImage.skewable = props.transformable
    cropperImage.translatable = props.transformable
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

  const imgInfo = getSourceImageCoordinates(selection)

  if (props.coordinatesOnly) {
    emit('cropend', { imgBase64: '', imgInfo })
    return
  }

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

// 将选区坐标转换为原图坐标：取选区与图片的交集，无交集时返回空区域
// 注意：按图片显示区域等比换算，适用于未旋转、未斜切的图片（缩放、平移不影响）
function getSourceImageCoordinates(selection: HTMLElement) {
  const cropperImage = cropper.value?.getCropperImage()
  if (!cropperImage) return { x: 0, y: 0, width: 0, height: 0 }
  const selectionRect = selection.getBoundingClientRect()
  const imageRect = cropperImage.getBoundingClientRect()
  const naturalWidth = cropperImage.$image.naturalWidth
  const naturalHeight = cropperImage.$image.naturalHeight
  if (!imageRect.width || !imageRect.height || !naturalWidth || !naturalHeight) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  const scaleX = naturalWidth / imageRect.width
  const scaleY = naturalHeight / imageRect.height
  // 选区与图片显示区域的交集，四个方向都裁剪
  const left = Math.max(selectionRect.left, imageRect.left)
  const top = Math.max(selectionRect.top, imageRect.top)
  const right = Math.min(selectionRect.left + selectionRect.width, imageRect.left + imageRect.width)
  const bottom = Math.min(
    selectionRect.top + selectionRect.height,
    imageRect.top + imageRect.height
  )
  if (right <= left || bottom <= top) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  const x = Math.min(naturalWidth - 1, Math.round((left - imageRect.left) * scaleX))
  const y = Math.min(naturalHeight - 1, Math.round((top - imageRect.top) * scaleY))
  return {
    x,
    y,
    width: Math.min(naturalWidth - x, Math.max(1, Math.round((right - left) * scaleX))),
    height: Math.min(naturalHeight - y, Math.max(1, Math.round((bottom - top) * scaleY)))
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
<style lang="scss" scoped>
$prefix-cls: #{$namespace}-cropper-image;

.#{$prefix-cls} {
  // cropperjs 动态插入的自定义元素不受 scoped 样式约束，需要穿透设置高度
  > :deep(cropper-canvas) {
    height: 100%;
  }
}
</style>
