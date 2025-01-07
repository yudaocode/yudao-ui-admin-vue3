<template>
  <div style="position: relative">
    <canvas
      ref="canvasRef"
      @mousedown="mouseDown"
      @mousemove="mouseMove"
      @mouseup="mouseUp"
      @touchstart="touchStart"
      @touchmove="touchMove"
      @touchend="touchEnd"
      style="border: 1px solid lightgrey; max-width: 100%; display: block"
    >
    </canvas>

    <el-button
      style="position: absolute; bottom: 20px; right: 10px"
      type="primary"
      text
      size="small"
      @click="reset"
    >
      <Icon icon="ep:delete" class="mr-5px" />清除
    </el-button>
  </div>
</template>

<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'ESign' })

const emits = defineEmits(['update:bgColor'])
const props = defineProps({
  // 画布宽度，即导出图片的宽度
  width: propTypes.number.def(900),
  // 画布高度，即导出图片的高度
  height: propTypes.number.def(400),
  // 画笔粗细
  lineWidth: propTypes.number.def(10),
  // 画笔颜色
  lineColor: propTypes.string.def('#000000'),
  // 画布背景色，为空时画布背景透明
  bgColor: propTypes.string.def(''),
  // 是否裁剪，在画布设定尺寸基础上裁掉四周空白部分
  isCrop: propTypes.bool.def(false),
  // 清空画布时是否同时清空设置的背景色
  isClearBgColor: propTypes.bool.def(true),
  // 生成图片格式
  format: propTypes.string.def('image/png'),
  // 生成图片质量，0 到 1
  quality: propTypes.number.def(1)
})
const canvasRef = ref()
const hasDrew = ref(false)
const resultImg = ref('')
const points = ref<any>([])
const canvasTxt = ref()
const startX = ref(0)
const startY = ref(0)
const isDrawing = ref(false)
const sratio = ref(1)

const ratio = computed(() => {
  return props.height / props.width
})
const stageInfo = computed(() => {
  return canvasRef.value.getBoundingClientRect()
})
const bgColor = computed(() => {
  return props.bgColor ? props.bgColor : 'rgba(255, 255, 255, 0)'
})

watch(
  () => bgColor.value,
  () => {
    if (canvasRef.value) {
      canvasRef.value.style.background = bgColor.value
    }
  },
  {
    immediate: true
  }
)

const resizeHandler = () => {
  const canvas = canvasRef.value
  canvas.style.width = props.width + 'px'
  const realw = parseFloat(window.getComputedStyle(canvas).width)
  canvas.style.height = ratio.value * realw + 'px'
  canvasTxt.value = canvas.getContext('2d')
  canvasTxt.value.scale(1 * sratio.value, 1 * sratio.value)
  sratio.value = realw / props.width
  canvasTxt.value.scale(1 / sratio.value, 1 / sratio.value)
}
// For PC
const mouseDown = (e) => {
  e.preventDefault()
  isDrawing.value = true
  hasDrew.value = true
  let obj = {
    x: e.offsetX,
    y: e.offsetY
  }
  drawStart(obj)
}
const mouseMove = (e) => {
  e.preventDefault()
  if (isDrawing.value) {
    let obj = {
      x: e.offsetX,
      y: e.offsetY
    }
    drawMove(obj)
  }
}
const mouseUp = (e) => {
  e.preventDefault()
  let obj = {
    x: e.offsetX,
    y: e.offsetY
  }
  drawEnd(obj)
  isDrawing.value = false
}
// For Mobile
const touchStart = (e) => {
  e.preventDefault()
  hasDrew.value = true
  if (e.touches.length === 1) {
    let obj = {
      x: e.targetTouches[0].clientX - canvasRef.value.getBoundingClientRect().left,
      y: e.targetTouches[0].clientY - canvasRef.value.getBoundingClientRect().top
    }
    drawStart(obj)
  }
}
const touchMove = (e) => {
  e.preventDefault()
  if (e.touches.length === 1) {
    let obj = {
      x: e.targetTouches[0].clientX - canvasRef.value.getBoundingClientRect().left,
      y: e.targetTouches[0].clientY - canvasRef.value.getBoundingClientRect().top
    }
    drawMove(obj)
  }
}
const touchEnd = (e) => {
  e.preventDefault()
  if (e.touches.length === 1) {
    let obj = {
      x: e.targetTouches[0].clientX - canvasRef.value.getBoundingClientRect().left,
      y: e.targetTouches[0].clientY - canvasRef.value.getBoundingClientRect().top
    }
    drawEnd(obj)
  }
}
// 绘制
const drawStart = (obj) => {
  startX.value = obj.x
  startY.value = obj.y
  canvasTxt.value.beginPath()
  canvasTxt.value.moveTo(startX.value, startY.value)
  canvasTxt.value.lineTo(obj.x, obj.y)
  canvasTxt.value.lineCap = 'round'
  canvasTxt.value.lineJoin = 'round'
  canvasTxt.value.lineWidth = props.lineWidth * sratio.value
  canvasTxt.value.stroke()
  canvasTxt.value.closePath()
  points.value.push(obj)
}
const drawMove = (obj) => {
  canvasTxt.value.beginPath()
  canvasTxt.value.moveTo(startX.value, startY.value)
  canvasTxt.value.lineTo(obj.x, obj.y)
  canvasTxt.value.strokeStyle = props.lineColor
  canvasTxt.value.lineWidth = props.lineWidth * sratio.value
  canvasTxt.value.lineCap = 'round'
  canvasTxt.value.lineJoin = 'round'
  canvasTxt.value.stroke()
  canvasTxt.value.closePath()
  startY.value = obj.y
  startX.value = obj.x
  points.value.push(obj)
}
const drawEnd = (obj) => {
  canvasTxt.value.beginPath()
  canvasTxt.value.moveTo(startX.value, startY.value)
  canvasTxt.value.lineTo(obj.x, obj.y)
  canvasTxt.value.lineCap = 'round'
  canvasTxt.value.lineJoin = 'round'
  canvasTxt.value.stroke()
  canvasTxt.value.closePath()
  points.value.push(obj)
  points.value.push({ x: -1, y: -1 })
}
// 生成
const generate = (options) => {
  let imgFormat = options && options.format ? options.format : props.format
  let imgQuality = options && options.quality ? options.quality : props.quality
  const pm = new Promise((resolve, reject) => {
    if (!hasDrew.value) {
      reject(`Warning: Not Signned!`)
      return
    }
    let resImgData = canvasTxt.value.getImageData(
      0,
      0,
      canvasRef.value.width,
      canvasRef.value.height
    )
    canvasTxt.value.globalCompositeOperation = 'destination-over'
    canvasTxt.value.fillStyle = bgColor.value
    canvasTxt.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    resultImg.value = canvasRef.value.toDataURL(imgFormat, imgQuality)
    canvasTxt.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    canvasTxt.value.putImageData(resImgData, 0, 0)
    canvasTxt.value.globalCompositeOperation = 'source-over'
    if (props.isCrop) {
      const crop_area = getCropArea(resImgData.data)
      let crop_canvas = document.createElement('canvas')
      const crop_ctx = crop_canvas.getContext('2d')
      crop_canvas.width = crop_area[2] - crop_area[0]
      crop_canvas.height = crop_area[3] - crop_area[1]
      const crop_imgData = canvasTxt.value.getImageData(...crop_area)
      crop_ctx.globalCompositeOperation = 'destination-over'
      crop_ctx.putImageData(crop_imgData, 0, 0)
      crop_ctx.fillStyle = bgColor.value
      crop_ctx.fillRect(0, 0, crop_canvas.width, crop_canvas.height)
      resultImg.value = crop_canvas.toDataURL(imgFormat, imgQuality)
    }
    resolve(resultImg.value)
  })
  return pm
}
const reset = () => {
  canvasTxt.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  if (props.isClearBgColor) {
    emits('update:bgColor', '')
    canvasRef.value.style.background = 'rgba(255, 255, 255, 0)'
  }
  points.value = []
  hasDrew.value = false
  resultImg.value = ''
}
const getCropArea = (imgData) => {
  let topX = canvasRef.value.width
  let btmX = 0
  let topY = canvasRef.value.height
  let btnY = 0
  for (let i = 0; i < canvasRef.value.width; i++) {
    for (let j = 0; j < canvasRef.value.height; j++) {
      let pos = (i + canvasRef.value.width * j) * 4
      if (imgData[pos] > 0 || imgData[pos + 1] > 0 || imgData[pos + 2] || imgData[pos + 3] > 0) {
        btnY = Math.max(j, btnY)
        btmX = Math.max(i, btmX)
        topY = Math.min(j, topY)
        topX = Math.min(i, topX)
      }
    }
  }
  topX++
  btmX++
  topY++
  btnY++
  const data = [topX, topY, btmX, btnY]
  return data
}

defineExpose({
  generate
})
onBeforeMount(() => {
  window.addEventListener('resize', resizeHandler)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
})
onMounted(() => {
  canvasRef.value.height = props.height
  canvasRef.value.width = props.width
  canvasRef.value.style.background = bgColor.value
  resizeHandler()
  // 在画板以外松开鼠标后冻结画笔
  document.onmouseup = () => {
    isDrawing.value = false
  }
})
</script>
