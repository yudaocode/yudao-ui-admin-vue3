<!-- AI 绘图：Midjourney 局部重绘（涂抹蒙版：黑底，白色为重绘区域） -->
<template>
  <Dialog v-model="dialogVisible" title="局部重绘" width="760px">
    <div class="flex flex-col gap-12px">
      <!-- 工具栏 -->
      <div class="flex flex-wrap items-center gap-12px">
        <el-radio-group v-model="tool" size="small">
          <el-radio-button value="brush">画笔</el-radio-button>
          <el-radio-button value="eraser">橡皮擦</el-radio-button>
        </el-radio-group>
        <div class="flex items-center gap-8px text-12px">
          笔刷
          <el-slider v-model="brushSize" :min="10" :max="200" class="!w-160px" />
        </div>
        <el-button size="small" :disabled="strokes.length === 0" @click="handleUndo">
          撤销
        </el-button>
        <el-button size="small" :disabled="strokes.length === 0" @click="handleClear">
          清空
        </el-button>
        <span class="text-12px text-[var(--el-text-color-secondary)]">涂抹需要重绘的区域</span>
      </div>
      <!-- 画布：图片 + 涂抹层 -->
      <div class="flex justify-center rounded-8px bg-[var(--el-fill-color-light)]">
        <div class="relative inline-block max-w-full leading-none">
          <img
            v-if="image"
            :src="image.picUrl"
            class="block max-h-480px max-w-full select-none"
            draggable="false"
            @load="handleImageLoad"
          />
          <canvas
            ref="canvasRef"
            class="absolute left-0 top-0 h-full w-full cursor-crosshair touch-none opacity-50"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            @pointerleave="handlePointerUp"
          ></canvas>
        </div>
      </div>
      <el-input
        v-model="prompt"
        type="textarea"
        :rows="3"
        :maxlength="PROMPT_MAX"
        show-word-limit
        placeholder="描述重绘区域的内容，例如：换成一顶红色的帽子"
      />
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交重绘</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ImageApi, ImageVO } from '@/api/ai/image'
import { useUpload } from '@/components/UploadFile/src/useUpload'

defineOptions({ name: 'AiImageMaskDialog' })

const emit = defineEmits(['success'])

const message = useMessage() // 消息弹窗

const PROMPT_MAX = 1200 // 与 AiMidjourneyModalReqVO.prompt 上限一致
const BRUSH_COLOR = '#409eff' // 涂抹层的显示颜色

interface Stroke {
  tool: 'brush' | 'eraser'
  size: number // 原图像素
  points: { x: number; y: number }[] // 原图坐标
}

const dialogVisible = ref(false)
const image = ref<ImageVO>()
const prompt = ref('')
const tool = ref<'brush' | 'eraser'>('brush')
const brushSize = ref(60) // 屏幕像素
const strokes = ref<Stroke[]>([])
const canvasRef = ref<HTMLCanvasElement>()
let drawing: Stroke | undefined // 正在绘制的笔画
// TODO DONE @AI：openCount 是不是去掉噢？有点过度了。。。（已去掉，改为提交完成时按 source.id 判断是否关闭弹窗）

/** 打开弹窗 */
const open = (source: ImageVO) => {
  image.value = source
  prompt.value = source.prompt || ''
  strokes.value = []
  tool.value = 'brush'
  dialogVisible.value = true
  // 同一张图片再次打开时不会触发 load：清除上次的涂抹
  nextTick(redraw)
}

/** 图片加载完成：画布使用原图尺寸，蒙版与原图一一对应 */
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  redraw()
}

/** 屏幕坐标 → 原图坐标；笔刷大小按同一比例换算 */
const getScale = () => {
  const canvas = canvasRef.value!
  return canvas.width / canvas.getBoundingClientRect().width
}
const getPoint = (event: PointerEvent) => {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  }
}

/** 绘制笔画；mask 为 true 时画到蒙版（画笔白色、橡皮擦黑色） */
const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, mask: boolean) => {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = stroke.size
  if (mask) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = stroke.tool === 'brush' ? '#ffffff' : '#000000'
  } else {
    ctx.globalCompositeOperation = stroke.tool === 'brush' ? 'source-over' : 'destination-out'
    ctx.strokeStyle = BRUSH_COLOR
  }
  ctx.fillStyle = ctx.strokeStyle
  const [first, ...rest] = stroke.points
  if (rest.length === 0) {
    ctx.beginPath()
    ctx.arc(first.x, first.y, stroke.size / 2, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(first.x, first.y)
    rest.forEach((point) => ctx.lineTo(point.x, point.y))
    ctx.stroke()
  }
  ctx.restore()
}

/** 重绘涂抹层 */
const redraw = () => {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) {
    return
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  strokes.value.forEach((stroke) => drawStroke(ctx, stroke, false))
  if (drawing) {
    drawStroke(ctx, drawing, false)
  }
}

const handlePointerDown = (event: PointerEvent) => {
  if (!canvasRef.value?.width) {
    return
  }
  ;(event.target as HTMLCanvasElement).setPointerCapture(event.pointerId)
  drawing = { tool: tool.value, size: brushSize.value * getScale(), points: [getPoint(event)] }
  redraw()
}
const handlePointerMove = (event: PointerEvent) => {
  if (!drawing) {
    return
  }
  drawing.points.push(getPoint(event))
  redraw()
}
const handlePointerUp = () => {
  if (!drawing) {
    return
  }
  strokes.value.push(drawing)
  drawing = undefined
  redraw()
}

/** 撤销、清空 */
const handleUndo = () => {
  strokes.value.pop()
  redraw()
}
const handleClear = () => {
  strokes.value = []
  redraw()
}

/** 生成蒙版图片：黑底，白色为重绘区域 */
const buildMaskFile = async (source: ImageVO): Promise<File> => {
  const canvas = document.createElement('canvas')
  canvas.width = canvasRef.value!.width
  canvas.height = canvasRef.value!.height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  strokes.value.forEach((stroke) => drawStroke(ctx, stroke, true))
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) {
    throw new Error('蒙版生成失败')
  }
  return new File([blob], `mask-${source.id}-${Date.now()}.png`, { type: 'image/png' })
}

/** 提交：蒙版上传到文件服务，再提交局部重绘 */
const { httpRequest } = useUpload()
const submitting = ref(false)
const handleSubmit = async () => {
  if (!strokes.value.some((stroke) => stroke.tool === 'brush')) {
    message.warning('请先涂抹需要重绘的区域')
    return
  }
  if (!prompt.value.trim()) {
    message.warning('请输入重绘提示词')
    return
  }
  // 本次提交的作品、提示词：上传期间可能已取消并打开其它作品
  const source = image.value!
  const sourcePrompt = prompt.value
  submitting.value = true
  try {
    const file = await buildMaskFile(source)
    const result: any = await httpRequest({ file, filename: file.name } as any)
    await ImageApi.midjourneyModal({
      id: source.id,
      prompt: sourcePrompt,
      maskUrl: result.data
    })
    message.success('已提交局部重绘')
    // 上传期间可能已取消并打开其它作品：只在仍是本次作品时关闭弹窗
    if (image.value?.id === source.id) {
      dialogVisible.value = false
    }
    emit('success')
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>
