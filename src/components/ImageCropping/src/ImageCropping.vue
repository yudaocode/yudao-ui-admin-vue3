<template>
  <div :class="[prefixCls, { 'flex items-center': showResult }]">
    <div>
      <div ref="boxRef" :class="`${prefixCls}-box`" :style="boxStyle">
        <img ref="imgRef" :alt="t('cropper.preview')" crossorigin="anonymous" />
      </div>
      <div v-if="showActions" class="mt-10px flex items-center">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleUploadChange"
          :show-file-list="false"
          accept="image/*"
        >
          <el-tooltip :content="t('cropper.selectImage')" placement="bottom">
            <el-button size="small" type="primary">
              <Icon icon="ant-design:upload-outlined" />
            </el-button>
          </el-tooltip>
        </el-upload>
        <div class="flex flex-1 items-center justify-end">
          <el-tooltip :content="t('cropper.btn_reset')" placement="bottom">
            <el-button size="small" type="primary" @click="reset">
              <Icon icon="ant-design:reload-outlined" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('cropper.btn_rotate_left')" placement="bottom">
            <el-button size="small" type="primary" @click="rotate(-45)">
              <Icon icon="ant-design:rotate-left-outlined" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('cropper.btn_rotate_right')" placement="bottom">
            <el-button size="small" type="primary" @click="rotate(45)">
              <Icon icon="ant-design:rotate-right-outlined" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('cropper.btn_scale_x')" placement="bottom">
            <el-button size="small" type="primary" @click="flip(-1, 1)">
              <Icon icon="vaadin:arrows-long-h" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('cropper.btn_scale_y')" placement="bottom">
            <el-button size="small" type="primary" @click="flip(1, -1)">
              <Icon icon="vaadin:arrows-long-v" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('cropper.btn_zoom_in')" placement="bottom">
            <el-button size="small" type="primary" @click="zoom(0.1)">
              <Icon icon="ant-design:zoom-in-outlined" />
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('cropper.btn_zoom_out')" placement="bottom">
            <el-button size="small" type="primary" @click="zoom(-0.1)">
              <Icon icon="ant-design:zoom-out-outlined" />
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>
    <div v-if="showResult && imgBase64" class="ml-20px">
      <div class="flex items-center justify-center">
        <img
          :alt="t('cropper.preview')"
          :src="imgBase64"
          :style="cropBoxStyle"
          class="rounded-[50%]"
        />
      </div>
      <el-divider />
      <div class="flex items-center justify-center">
        <img
          v-for="(scale, index) in PREVIEW_SCALES"
          :key="scale"
          :alt="t('cropper.preview')"
          :class="{ 'ml-20px': index > 0 }"
          :src="imgBase64"
          :style="getScaleSize(scale)"
          class="rounded-[50%]"
        />
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { UploadFile, UploadInstance } from 'element-plus'
import Cropper from 'cropperjs'
import type { CropperCanvas, CropperImage, CropperSelection } from 'cropperjs'
import { useResizeObserver } from '@vueuse/core'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ImageCropping' })

const props = defineProps({
  // 待裁剪图片地址；为空时隐藏裁剪区，仍可通过「选择图片」裁剪本地文件
  imageUrl: {
    type: String,
    default: ''
  },
  // 裁剪框尺寸（px），同时决定裁剪框比例与结果预览尺寸
  cropBoxWidth: {
    type: Number,
    default: 200
  },
  cropBoxHeight: {
    type: Number,
    default: 200
  },
  // 裁剪区尺寸：数字按 px，字符串原样作为 CSS 尺寸（如 '100%'）
  boxWidth: {
    type: [Number, String] as PropType<number | string>,
    default: 425
  },
  boxHeight: {
    type: [Number, String] as PropType<number | string>,
    default: 320
  },
  showResult: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const { t } = useI18n()
const message = useMessage()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('image-cropping')

// 结果预览的缩略倍数
const PREVIEW_SCALES = [0.2, 0.25, 0.3, 0.35]
// 结果预览防抖时长（ms）
const PREVIEW_DELAY = 80
// 与 cropperjs 默认模板一致，区别：拖拽画布空白处移动图片而不是新建选区（对应上游 v1 的 dragMode: 'move'），
// 图片不开启斜切，选区不设 initial-coverage（尺寸由 cropBoxWidth/cropBoxHeight 决定）
const TEMPLATE =
  '<cropper-canvas background>' +
  '<cropper-image rotatable scalable translatable></cropper-image>' +
  '<cropper-shade hidden></cropper-shade>' +
  '<cropper-handle action="move" plain></cropper-handle>' +
  '<cropper-selection movable resizable>' +
  '<cropper-grid role="grid" bordered covered></cropper-grid>' +
  '<cropper-crosshair centered></cropper-crosshair>' +
  '<cropper-handle action="move" theme-color="rgba(255, 255, 255, 0.35)"></cropper-handle>' +
  '<cropper-handle action="n-resize"></cropper-handle>' +
  '<cropper-handle action="e-resize"></cropper-handle>' +
  '<cropper-handle action="s-resize"></cropper-handle>' +
  '<cropper-handle action="w-resize"></cropper-handle>' +
  '<cropper-handle action="ne-resize"></cropper-handle>' +
  '<cropper-handle action="nw-resize"></cropper-handle>' +
  '<cropper-handle action="se-resize"></cropper-handle>' +
  '<cropper-handle action="sw-resize"></cropper-handle>' +
  '</cropper-selection>' +
  '</cropper-canvas>'

const boxRef = ref<HTMLElement>()
const imgRef = ref<HTMLImageElement>()
const uploadRef = ref<UploadInstance>()
// cropperjs v2 实例：通过 getCropperCanvas()/getCropperImage()/getCropperSelection() 获取自定义元素操作，
// 裁剪结果为异步的 selection.$toCanvas()；不同于上游 v1 实例，没有 getCroppedCanvas/rotate/zoom 等同步方法
const cropperRef = shallowRef<Cropper>()
const imgBase64 = ref('')

// 当前图片地址、是否已加载并完成 cropperjs 布局；本组件为本地文件创建的 objectURL（调用方传入的地址不由本组件释放）
let currentSrc = ''
let imageReady = false
let objectUrl = ''
// 预览序号：换图、清空或卸载后，旧的异步结果不再回填
let previewToken = 0
let previewTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
// 组件自身重置、居中图片期间不做图片边界拦截（随后统一重新放置选区）
let adjustingImage = false
// 越界后的贴边修正只尝试一次，修正结果仍越界时直接拒绝，避免事件循环
let clampingSelection = false
let clampingImage = false

// 边界比较的浮点容差（px）
const EPSILON = 0.001

interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

const toCssSize = (value: number | string) => {
  return typeof value === 'number' || /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value
}

const boxStyle = computed((): CSSProperties => {
  return {
    width: toCssSize(props.boxWidth),
    height: toCssSize(props.boxHeight)
  }
})

const cropBoxStyle = computed((): CSSProperties => {
  return {
    width: `${props.cropBoxWidth}px`,
    height: `${props.cropBoxHeight}px`
  }
})

// 获取对应的缩小倍数的宽高
const getScaleSize = (scale: number): CSSProperties => {
  return {
    width: `${props.cropBoxWidth * scale}px`,
    height: `${props.cropBoxHeight * scale}px`
  }
}

const getCanvas = (): CropperCanvas | null => cropperRef.value?.getCropperCanvas() ?? null
const getImage = (): CropperImage | null => cropperRef.value?.getCropperImage() ?? null
const getSelection = (): CropperSelection | null => cropperRef.value?.getCropperSelection() ?? null

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * 图片按指定矩阵变换后的外接矩形（画布坐标）。cropper-image 与 cropper-selection 同以画布左上角为原点，
 * 变换原点为图片中心：x' = cx + a·u + c·v + e，y' = cy + b·u + d·v + f（u、v 为相对中心的角点坐标）
 */
const getImageBox = (image: CropperImage, matrix = image.$getTransform()): Bounds | null => {
  const width = image.offsetWidth
  const height = image.offsetHeight
  if (!width || !height) return null
  const [a, b, c, d, e, f] = matrix
  const centerX = image.offsetLeft + width / 2
  const centerY = image.offsetTop + height / 2
  const xs: number[] = []
  const ys: number[] = []
  for (const [u, v] of [
    [-width / 2, -height / 2],
    [width / 2, -height / 2],
    [width / 2, height / 2],
    [-width / 2, height / 2]
  ]) {
    xs.push(centerX + a * u + c * v + e)
    ys.push(centerY + b * u + d * v + f)
  }
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys)
  }
}

/**
 * 选区可放置的范围（对应上游 v1 的 viewMode: 1）：画布与图片变换后外接矩形的交集，向内取整到整数像素；
 * 图片未就绪时只限制在画布内。画布不可见时返回 null，不做限制
 */
const getCropBounds = (): Bounds | null => {
  const canvas = getCanvas()
  if (!canvas || !canvas.offsetWidth || !canvas.offsetHeight) return null
  let left = 0
  let top = 0
  let right = canvas.offsetWidth
  let bottom = canvas.offsetHeight
  const image = getImage()
  const imageBox = imageReady && image ? getImageBox(image) : null
  if (imageBox) {
    left = Math.max(left, imageBox.left)
    top = Math.max(top, imageBox.top)
    right = Math.min(right, imageBox.right)
    bottom = Math.min(bottom, imageBox.bottom)
  }
  return {
    left: Math.ceil(left - EPSILON),
    top: Math.ceil(top - EPSILON),
    right: Math.floor(right + EPSILON),
    bottom: Math.floor(bottom + EPSILON)
  }
}

const isRectInBounds = (rect: Rect, bounds: Bounds) => {
  return (
    rect.x >= bounds.left &&
    rect.y >= bounds.top &&
    rect.x + rect.width <= bounds.right &&
    rect.y + rect.height <= bounds.bottom
  )
}

/** 选区是否位于可放置范围内（范围不可用时视为满足） */
const isSelectionInBounds = (rect: Rect) => {
  const bounds = getCropBounds()
  return !bounds || isRectInBounds(rect, bounds)
}

/** 与 cropperjs 选区按 aspectRatio（cover）调整再取整的结果一致 */
const adjustSize = (width: number, height: number, aspectRatio: number) => {
  if (height * aspectRatio < width) height = width / aspectRatio
  else width = height * aspectRatio
  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * 按比例求宽度不超过 width、且能放入范围的整数尺寸；放不下 1px 时返回 null。
 * 结果经 adjustSize 反复调整至不再变化，之后拖动选区时 cropperjs 不会再改变尺寸（避免被放大 1px 越界）
 */
const fitSize = (width: number, aspectRatio: number, bounds: Bounds) => {
  const maxWidth = bounds.right - bounds.left
  const maxHeight = bounds.bottom - bounds.top
  for (
    let fitWidth = Math.floor(Math.min(width, maxWidth, maxHeight * aspectRatio));
    fitWidth >= 1;
    fitWidth--
  ) {
    let size = adjustSize(fitWidth, fitWidth / aspectRatio, aspectRatio)
    for (let i = 0; i < 3; i++) {
      const next = adjustSize(size.width, size.height, aspectRatio)
      if (next.width === size.width && next.height === size.height) break
      size = next
    }
    if (size.width >= 1 && size.height >= 1 && size.width <= maxWidth && size.height <= maxHeight) {
      return size
    }
  }
  return null
}

/** 图片按画布居中并完整显示；图片尚未布局（尺寸为 0）时跳过 */
const centerImage = (image: CropperImage) => {
  const { width, height } = image.getBoundingClientRect()
  if (width > 0 && height > 0) image.$center('contain')
}

/** 组件自身调整图片（重置、居中）：期间不拦截变换，调用方随后重新放置选区 */
const adjustImage = (callback: (image: CropperImage) => void) => {
  const image = getImage()
  if (!image) return
  adjustingImage = true
  try {
    callback(image)
  } finally {
    adjustingImage = false
  }
}

/** 按 cropBoxWidth/cropBoxHeight 在可放置范围中居中放置选区；放不下时等比缩小 */
const resetCropBox = () => {
  const selection = getSelection()
  const bounds = getCropBounds()
  if (!selection || !bounds || props.cropBoxWidth <= 0 || props.cropBoxHeight <= 0) return
  const aspectRatio = props.cropBoxWidth / props.cropBoxHeight
  selection.aspectRatio = aspectRatio
  const size = fitSize(props.cropBoxWidth, aspectRatio, bounds)
  if (!size) return
  // 尺寸已按比例调整取整，aspectRatio 传 NaN 不再重复调整
  selection.$change(
    bounds.left + Math.floor((bounds.right - bounds.left - size.width) / 2),
    bounds.top + Math.floor((bounds.bottom - bounds.top - size.height) / 2),
    size.width,
    size.height,
    NaN
  )
}

/** 图片缩放、旋转后范围变化：选区越界时先等比缩小到能放入，再平移进范围 */
const fitSelection = () => {
  const selection = getSelection()
  const bounds = getCropBounds()
  if (!selection || !bounds || !selection.width || !selection.height) return
  if (isRectInBounds(selection, bounds)) return
  const aspectRatio =
    selection.aspectRatio > 0 ? selection.aspectRatio : selection.width / selection.height
  const size = fitSize(selection.width, aspectRatio, bounds)
  if (!size) return
  selection.$change(
    clamp(selection.x, bounds.left, bounds.right - size.width),
    clamp(selection.y, bounds.top, bounds.bottom - size.height),
    size.width,
    size.height,
    NaN
  )
}

const clearPreview = () => {
  clearTimeout(previewTimer)
  previewTimer = undefined
  previewToken++
  imgBase64.value = ''
}

const updatePreview = async () => {
  previewTimer = undefined
  const token = ++previewToken
  const selection = getSelection()
  if (!selection || !imageReady || !props.showResult) return
  try {
    const canvas = await selection.$toCanvas()
    if (disposed || token !== previewToken) return
    imgBase64.value = canvas.width > 0 && canvas.height > 0 ? canvas.toDataURL() : ''
  } catch {
    // 图片加载失败、跨域图片无法导出等情况下不显示结果
    if (!disposed && token === previewToken) imgBase64.value = ''
  }
}

const schedulePreview = () => {
  if (disposed) return
  clearTimeout(previewTimer)
  previewTimer = setTimeout(updatePreview, PREVIEW_DELAY)
}

/** 拖动选区越界时贴边：只平移、尺寸不变，放不下时不处理 */
const clampSelectionMove = (x: number, y: number) => {
  const selection = getSelection()
  const bounds = getCropBounds()
  if (!selection || !bounds) return
  const maxX = bounds.right - selection.width
  const maxY = bounds.bottom - selection.height
  if (maxX < bounds.left || maxY < bounds.top) return
  clampingSelection = true
  try {
    selection.$change(clamp(x, bounds.left, maxX), clamp(y, bounds.top, maxY))
  } finally {
    clampingSelection = false
  }
}

/**
 * 选区变化：越出可放置范围时取消（cropperjs 的 change 事件可取消，shade 也按取消后的选区绘制）。
 * 事件中不同步修改选区；拖动越界时在微任务中贴边一次，贴边结果仍越界则直接拒绝
 */
const handleSelectionChange = (event: Event) => {
  const rect = (event as CustomEvent<Rect>).detail
  if (!isSelectionInBounds(rect)) {
    event.preventDefault()
    const selection = getSelection()
    if (
      !clampingSelection &&
      selection &&
      rect.width === selection.width &&
      rect.height === selection.height
    ) {
      queueMicrotask(() => clampSelectionMove(rect.x, rect.y))
    }
    return
  }
  schedulePreview()
}

/** 拖动图片越界时贴边：只调整平移量，使图片外接矩形刚好覆盖选区 */
const clampImageMove = (matrix: number[]) => {
  const image = getImage()
  const selection = getSelection()
  if (!image || !selection) return
  const box = getImageBox(image, matrix)
  if (!box) return
  if (box.right - box.left < selection.width || box.bottom - box.top < selection.height) return
  let dx = 0
  let dy = 0
  if (box.left > selection.x) dx = selection.x - box.left
  else if (box.right < selection.x + selection.width) dx = selection.x + selection.width - box.right
  if (box.top > selection.y) dy = selection.y - box.top
  else if (box.bottom < selection.y + selection.height) {
    dy = selection.y + selection.height - box.bottom
  }
  const [a, b, c, d, e, f] = matrix
  clampingImage = true
  try {
    image.$setTransform(a, b, c, d, e + dx, f + dy)
  } finally {
    clampingImage = false
  }
}

/** 图片外接矩形是否覆盖选区 */
const isBoxCoverSelection = (box: Bounds, selection: CropperSelection) => {
  return (
    box.left <= selection.x + EPSILON &&
    box.top <= selection.y + EPSILON &&
    box.right >= selection.x + selection.width - EPSILON &&
    box.bottom >= selection.y + selection.height - EPSILON
  )
}

/**
 * 图片变换（transform 事件可取消，detail 为新旧矩阵）：
 * - 只平移（拖动图片）时，新位置不再覆盖选区则取消，并在微任务中贴边一次（对应上游 v1 viewMode: 1 限制画布位置）；
 * - 缩放、旋转、翻转照常执行，之后在微任务中把选区缩小/平移回新的可放置范围（对应 v1 按画布限制裁剪框）
 */
const handleImageTransform = (event: Event) => {
  const image = getImage()
  const selection = getSelection()
  if (!adjustingImage && imageReady && image && selection?.width && selection.height) {
    const { matrix, oldMatrix } = (event as CustomEvent<{ matrix: number[]; oldMatrix: number[] }>)
      .detail
    const translateOnly = matrix.slice(0, 4).every((value, index) => value === oldMatrix[index])
    if (translateOnly) {
      const box = getImageBox(image, matrix)
      if (box && !isBoxCoverSelection(box, selection)) {
        event.preventDefault()
        if (!clampingImage) queueMicrotask(() => clampImageMove(matrix))
        return
      }
    } else {
      queueMicrotask(fitSelection)
    }
  }
  schedulePreview()
}

/** 图片加载完成（cropperjs 自身的 load 处理先于本组件执行，此时图片已按画布居中） */
const handleImageReady = () => {
  if (disposed || !currentSrc) return
  imageReady = true
  // 同一地址不会重新加载、居中，这里统一按画布居中
  adjustImage(centerImage)
  resetCropBox()
  schedulePreview()
}

const handleImageError = () => {
  if (disposed || !currentSrc) return
  imageReady = false
  clearPreview()
}

/** 切换图片：url 为空时隐藏裁剪区并清空结果 */
const loadImage = (url: string) => {
  const canvas = getCanvas()
  const image = getImage()
  if (!canvas || !image) return
  imageReady = false
  clearPreview()
  currentSrc = url
  canvas.hidden = !url
  if (!url) return
  // 新图片从初始状态居中显示，旋转、缩放、翻转不带到新图片
  adjustImage((target) => target.$resetTransform())
  if (image.src === url) {
    // 地址未变不会再触发 load：已加载成功则直接就绪；仍在加载则等待 load；此前加载失败则保持未就绪
    const { $image } = image
    if ($image.complete && $image.naturalWidth > 0) handleImageReady()
    return
  }
  image.src = url
}

const revokeObjectUrl = (url: string) => {
  if (url) URL.revokeObjectURL(url)
}

const handleUploadChange = (uploadFile: UploadFile) => {
  // 只在本地读取文件，不提交上传；清空上传组件的内部列表，避免文件持续累积
  uploadRef.value?.clearFiles()
  const raw = uploadFile.raw
  if (!raw) return
  if (!raw.type.startsWith('image/')) {
    message.error(t('cropper.imageTypeError'))
    return
  }
  const previous = objectUrl
  objectUrl = URL.createObjectURL(raw)
  loadImage(objectUrl)
  revokeObjectUrl(previous)
}

const reset = () => {
  adjustImage((image) => {
    image.$resetTransform()
    if (imageReady) centerImage(image)
  })
  resetCropBox()
}

const rotate = (deg: number) => {
  getImage()?.$rotate(`${deg}deg`)
}

// cropperjs v2 的 $scale 按当前矩阵叠加，传 -1 即翻转，再次点击恢复
const flip = (x: number, y: number) => {
  getImage()?.$scale(x, y)
}

const zoom = (scale: number) => {
  getImage()?.$zoom(scale)
}

onMounted(() => {
  const imgEl = unref(imgRef)
  if (!imgEl) return
  cropperRef.value = new Cropper(imgEl, { template: TEMPLATE })
  const image = getImage()
  getSelection()?.addEventListener('change', handleSelectionChange)
  image?.addEventListener('transform', handleImageTransform)
  // cropper-image 连接时已在内部 $image 上注册自身的 load 处理（设置尺寸并居中），本组件的监听在其后执行
  image?.$image.addEventListener('load', handleImageReady)
  image?.$image.addEventListener('error', handleImageError)
  resetCropBox()
  loadImage(props.imageUrl)
})

watch(
  () => props.imageUrl,
  (url) => {
    // 调用方更换图片后，释放本组件此前为本地文件创建的地址
    const previous = objectUrl
    objectUrl = ''
    loadImage(url)
    revokeObjectUrl(previous)
  }
)

watch(
  () => [props.cropBoxWidth, props.cropBoxHeight],
  () => {
    resetCropBox()
  }
)

watch(
  () => props.showResult,
  (show) => {
    if (show) schedulePreview()
  }
)

// 裁剪区尺寸变化（如 boxWidth 改变、百分比宽度随父容器变化）后，选区越出可放置范围时重新居中
useResizeObserver(boxRef, () => {
  const selection = getSelection()
  if (!selection) return
  if (!selection.width || !selection.height) {
    // 初始化时裁剪区不可见（如位于未展开的容器中），选区为空、图片未能按画布居中，可见后补做
    if (imageReady) {
      adjustImage((image) => {
        image.$resetTransform()
        centerImage(image)
      })
    }
    resetCropBox()
  } else if (!isSelectionInBounds(selection)) {
    // 画布缩小后图片可能已不在可见范围内，图片重新居中后再放置选区
    if (imageReady) adjustImage(centerImage)
    resetCropBox()
  }
})

onBeforeUnmount(() => {
  disposed = true
  clearPreview()
  const image = getImage()
  getSelection()?.removeEventListener('change', handleSelectionChange)
  image?.removeEventListener('transform', handleImageTransform)
  image?.$image.removeEventListener('load', handleImageReady)
  image?.$image.removeEventListener('error', handleImageError)
  // v2 的 destroy 移除插入的 cropper-canvas 并恢复原 img 显示
  cropperRef.value?.destroy()
  cropperRef.value = undefined
  revokeObjectUrl(objectUrl)
  objectUrl = ''
})

defineExpose({
  cropperExpose: cropperRef
})
</script>
<style lang="scss" scoped>
$prefix-cls: #{$namespace}-image-cropping;

.#{$prefix-cls} {
  &-box {
    // cropperjs 动态插入的自定义元素不受 scoped 样式约束，需要穿透设置尺寸
    > :deep(cropper-canvas) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
