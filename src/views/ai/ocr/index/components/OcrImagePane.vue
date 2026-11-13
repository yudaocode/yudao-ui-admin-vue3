<!-- AI 文字识别：左侧输入区的图片（选择、拖拽、缩放） -->
<template>
  <div class="min-h-0 w-full flex flex-1 flex-col">
    <!-- 标签不换行；缩放、更换图片放在同一行右侧 -->
    <div class="mb-8px flex items-center justify-between gap-8px">
      <span class="whitespace-nowrap text-14px">
        <span class="mr-4px text-[var(--el-color-danger)]">*</span>图片
      </span>
      <div v-if="src" class="flex flex-shrink-0 items-center gap-4px">
        <el-button-group>
          <el-button size="small" :disabled="fit || scale <= MIN_SCALE" @click="zoom(-STEP)">
            <Icon icon="ep:zoom-out" />
          </el-button>
          <el-button size="small" class="!w-56px" @click="toggleFit">
            {{ fit ? '适应' : `${Math.round(scale * 100)}%` }}
          </el-button>
          <el-button size="small" :disabled="!fit && scale >= MAX_SCALE" @click="zoom(STEP)">
            <Icon icon="ep:zoom-in" />
          </el-button>
        </el-button-group>
        <el-button size="small" :disabled="disabled" @click="chooseFile">更换图片</el-button>
      </div>
    </div>
    <!-- 文件名单独一行，过长时省略 -->
    <div
      v-if="fileName"
      class="mb-8px truncate text-12px text-[var(--el-text-color-secondary)]"
      :title="fileName"
    >
      {{ fileName }}
    </div>

    <div
      class="relative min-h-0 flex-1 overflow-auto border border-dashed rounded-8px bg-[var(--el-fill-color-lighter)]"
      :class="dragging ? 'border-[var(--el-color-primary)]' : 'border-[var(--el-border-color)]'"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="dragging = false"
      @drop.prevent="handleDrop"
    >
      <!-- 空状态：点击、拖拽、粘贴 -->
      <div
        v-if="!src"
        class="h-full flex cursor-pointer flex-col items-center justify-center gap-8px px-16px text-center text-[var(--el-text-color-secondary)]"
        @click="chooseFile"
      >
        <Icon icon="ep:upload-filled" :size="48" class="text-[var(--el-color-primary)]" />
        <div class="text-14px">点击选择、拖拽图片到这里</div>
        <div class="text-12px">或直接 Ctrl / ⌘ + V 粘贴截图</div>
      </div>
      <!-- 原图：适应时完整显示，否则按比例缩放、可滚动 -->
      <div v-else class="min-h-full min-w-full flex items-center justify-center p-12px">
        <img
          ref="imageRef"
          :src="src"
          alt="原图"
          class="block select-none"
          :class="fit ? 'max-h-full max-w-full object-contain' : 'max-w-none'"
          :style="imageStyle"
          draggable="false"
          @load="handleLoad"
        />
      </div>
    </div>

    <input ref="inputRef" type="file" class="hidden" accept="image/*" @change="handleInputChange" />
  </div>
</template>

<script setup lang="ts">
/** AI 文字识别：左侧输入区的图片 */
defineOptions({ name: 'AiOcrImagePane' })

const props = defineProps<{
  src?: string // 图片地址：本地预览的 ObjectURL，或历史记录的图片地址
  fileName?: string // 文件名
  disabled?: boolean // 识别中时，不允许更换图片
}>()

const emit = defineEmits<{
  (e: 'select', file: File): void
}>()

const MIN_SCALE = 0.1
const MAX_SCALE = 5
const STEP = 0.25

const inputRef = ref<HTMLInputElement>()
const imageRef = ref<HTMLImageElement>()
const fit = ref(true) // 是否适应容器
const scale = ref(1) // 缩放比例，相对图片原始尺寸
const naturalWidth = ref(0) // 图片原始宽度
const dragging = ref(false) // 是否拖拽悬停中

const imageStyle = computed(() =>
  fit.value || !naturalWidth.value ? {} : { width: `${naturalWidth.value * scale.value}px` }
)

/** 图片加载完成：记录原始宽度，并回到适应模式 */
const handleLoad = () => {
  naturalWidth.value = imageRef.value?.naturalWidth || 0
}

/** 切换图片时，回到适应模式 */
watch(
  () => props.src,
  () => {
    fit.value = true
    scale.value = 1
    naturalWidth.value = 0
  }
)

/** 当前实际显示比例：从适应切到缩放时，以它为起点 */
const getDisplayScale = () => {
  const image = imageRef.value
  if (!image || !naturalWidth.value) {
    return 1
  }
  return image.clientWidth / naturalWidth.value
}

/** 缩放 */
const zoom = (delta: number) => {
  const base = fit.value ? getDisplayScale() : scale.value
  fit.value = false
  scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((base + delta) * 100) / 100))
}

/** 在适应、原始大小之间切换 */
const toggleFit = () => {
  if (fit.value) {
    fit.value = false
    scale.value = 1
  } else {
    fit.value = true
  }
}

/** 选择文件 */
const chooseFile = () => {
  if (props.disabled) {
    return
  }
  inputRef.value?.click()
}

const handleInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许再次选择同一个文件
  if (file) {
    emit('select', file)
  }
}

/** 拖拽 */
const handleDragOver = () => {
  if (!props.disabled) {
    dragging.value = true
  }
}

const handleDrop = (event: DragEvent) => {
  dragging.value = false
  if (props.disabled) {
    return
  }
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    emit('select', file)
  }
}

defineExpose({ chooseFile })
</script>
