<!-- AI PPT：预览弹窗；用户侧可修改本页、导出，管理端只读 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1100px" @closed="handleClosed">
    <div v-loading="loading" class="min-h-400px">
      <template v-if="ppt">
        <!-- 工具栏 -->
        <div class="mb-12px flex items-center justify-between gap-12px">
          <div class="flex items-center gap-12px text-13px">
            <dict-tag :type="DICT_TYPE.AI_PPT_STATUS" :value="ppt.status" />
            <span>{{ ppt.finishCount }} / {{ ppt.slideCount }} 页</span>
            <span
              v-if="ppt.status === AiPptStatusEnum.IN_PROGRESS"
              class="text-[var(--el-text-color-secondary)]"
            >
              每 3 秒刷新 · 已生成的页可先看
            </span>
          </div>
          <div class="flex items-center gap-8px">
            <el-popover v-if="currentSlide" placement="bottom-end" :width="420" trigger="click">
              <template #reference>
                <el-button size="small">显示提示词</el-button>
              </template>
              <div class="max-h-300px overflow-y-auto whitespace-pre-wrap break-all text-13px">
                {{ getCurrentPrompt(currentSlide) }}
              </div>
            </el-popover>
            <el-button
              v-if="!readonly && currentSlide"
              size="small"
              type="primary"
              plain
              :disabled="ppt.status === AiPptStatusEnum.IN_PROGRESS || !currentSlide.imageUrl"
              @click="openEdit"
            >
              修改
            </el-button>
            <el-dropdown
              v-if="!readonly && ppt.status === AiPptStatusEnum.SUCCESS"
              trigger="click"
              :disabled="exporting"
              @command="handleExport"
            >
              <el-button size="small" type="primary" :loading="exporting">
                导出 <Icon icon="ep:arrow-down" class="ml-2px" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="AiPptExportFormatEnum.PPTX"
                    >导出 PPTX</el-dropdown-item
                  >
                  <el-dropdown-item :command="AiPptExportFormatEnum.PDF">导出 PDF</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <!-- 任务失败原因 -->
        <el-alert
          v-if="ppt.status === AiPptStatusEnum.FAIL && ppt.errorMessage"
          type="error"
          :closable="false"
          show-icon
          class="mb-12px"
          :title="'任务已失败：' + ppt.errorMessage"
          :description="readonly ? undefined : '关闭后在列表点「继续生成」补齐'"
        />

        <!-- 分镜阶段 -->
        <div
          v-if="slides.length === 0"
          class="aspect-video flex flex-col items-center justify-center gap-8px rounded-6px bg-[var(--el-fill-color-light)] text-[var(--el-text-color-secondary)]"
        >
          <template v-if="ppt.status === AiPptStatusEnum.IN_PROGRESS">
            <Icon icon="ep:loading" :size="24" class="is-loading text-[var(--el-color-primary)]" />
            正在生成分镜…
          </template>
          <template v-else>没有分镜</template>
        </div>

        <div v-else class="flex gap-12px">
          <!-- 大图 -->
          <div class="min-w-0 flex-1">
            <PptSlideImage :slide="currentSlide!" :running="isRunning" preview />
            <div
              v-if="currentSlide?.status === AiPptStatusEnum.FAIL && currentSlide.errorMessage"
              class="mt-8px text-12px text-[var(--el-color-danger)]"
            >
              本页最近一次生成失败：{{ currentSlide.errorMessage }}
            </div>
            <div class="mt-10px flex items-center justify-center gap-16px">
              <el-button circle size="small" :disabled="currentIndex <= 0" @click="currentIndex--">
                <Icon icon="ep:arrow-left" />
              </el-button>
              <span class="text-13px">第 {{ currentIndex + 1 }} / {{ slides.length }} 页</span>
              <el-button
                circle
                size="small"
                :disabled="currentIndex >= slides.length - 1"
                @click="currentIndex++"
              >
                <Icon icon="ep:arrow-right" />
              </el-button>
            </div>
          </div>
          <!-- 缩略图 -->
          <div class="max-h-560px w-160px flex-shrink-0 overflow-y-auto pr-4px">
            <div
              v-for="(slide, index) in slides"
              :key="slide.index"
              class="relative mb-8px cursor-pointer overflow-hidden border-2 rounded-4px border-solid"
              :class="
                index === currentIndex
                  ? 'border-[var(--el-color-primary)]'
                  : 'border-transparent hover:border-[var(--el-border-color)]'
              "
              @click="currentIndex = index"
            >
              <PptSlideImage :slide="slide" :running="isRunning" />
              <span
                class="absolute left-4px top-4px rounded-2px bg-black/50 px-4px text-12px text-white"
              >
                {{ slide.index }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 修改本页 -->
    <el-drawer
      v-model="editVisible"
      :title="`修改第 ${currentSlide?.index} 页`"
      size="460px"
      append-to-body
    >
      <template v-if="currentSlide">
        <PptSlideImage :slide="currentSlide" :running="isRunning" />
        <div
          v-if="currentSlide.status === AiPptStatusEnum.FAIL && currentSlide.errorMessage"
          class="mt-8px text-12px text-[var(--el-color-danger)]"
        >
          重绘失败：{{ currentSlide.errorMessage }}（当前图未变化，可修改提示词后再试）
        </div>
        <div class="mb-8px mt-16px font-bold">生图提示词</div>
        <el-input
          v-model="editPrompt"
          type="textarea"
          :rows="8"
          maxlength="4000"
          show-word-limit
          placeholder="直接修改完整的生图提示词，例如改掉画错的字、换配色"
        />
        <div class="mt-6px text-12px leading-18px text-[var(--el-text-color-secondary)]">
          按修改后的提示词重新文生图，不参考当前图，构图可能整体变化；不满意可在下方切回历史版本
        </div>
        <el-button
          type="primary"
          class="mt-12px !w-full"
          :loading="redrawing"
          :disabled="ppt?.status === AiPptStatusEnum.IN_PROGRESS"
          @click="handleRedraw"
        >
          {{ isSlideRedrawing ? '本页重绘中…' : '重新生成' }}
        </el-button>

        <div class="mb-8px mt-20px font-bold">历史版本</div>
        <div class="grid grid-cols-2 gap-8px">
          <div
            v-for="image in currentSlide.images || []"
            :key="image.url"
            class="relative cursor-pointer overflow-hidden border-2 rounded-4px border-solid"
            :class="
              image.url === currentSlide.imageUrl
                ? 'border-[var(--el-color-primary)]'
                : 'border-transparent hover:border-[var(--el-border-color)]'
            "
            :title="image.prompt"
            @click="handleSwitchImage(image)"
          >
            <el-image :src="image.url" fit="cover" class="aspect-video w-full" />
            <el-tag
              v-if="image.url === currentSlide.imageUrl"
              size="small"
              effect="dark"
              class="absolute right-4px top-4px"
            >
              当前
            </el-tag>
            <div class="px-4px py-2px text-12px text-[var(--el-text-color-secondary)]">
              {{ formatDate(image.createTime, 'MM-DD HH:mm') }}
            </div>
          </div>
        </div>
      </template>
    </el-drawer>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import download from '@/utils/download'
import { PptApi, PptSlideImageVO, PptSlideVO, PptVO } from '@/api/ai/ppt'
import { AiPptExportFormatEnum, AiPptStatusEnum } from '@/views/ai/utils/constants'
import PptSlideImage from './PptSlideImage.vue'

/** AI PPT：预览弹窗 */
defineOptions({ name: 'AiPptPreviewDialog' })

const props = withDefaults(
  defineProps<{
    readonly?: boolean // 只读：管理端使用，没有修改、导出
  }>(),
  { readonly: false }
)
const emit = defineEmits<{
  refresh: [] // 任务状态变化（重绘、切换版本），用于刷新列表
}>()

const message = useMessage() // 消息弹窗

const POLL_INTERVAL = 3000 // 生成中时的刷新间隔

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 弹窗的加载中
const ppt = ref<PptVO>() // PPT 详情
const currentIndex = ref(0) // 当前页（slides 的下标）
const slides = computed<PptSlideVO[]>(() => ppt.value?.slides || []) // 分镜列表
const currentSlide = computed<PptSlideVO | undefined>(() => slides.value[currentIndex.value])
const isRunning = computed(() => ppt.value?.status === AiPptStatusEnum.IN_PROGRESS)
const isSlideRedrawing = computed(
  () => isRunning.value && currentSlide.value?.status === AiPptStatusEnum.IN_PROGRESS
)
const dialogTitle = computed(() => (ppt.value ? ppt.value.title + ' · 预览' : '预览'))
let pptId: number | undefined // 当前打开的 PPT 编号
let requestId = 0 // 请求序号：只采用最后一次请求的结果

/** 打开弹窗 */
const open = async (id: number) => {
  pptId = id
  ppt.value = undefined
  currentIndex.value = 0
  dialogVisible.value = true
  await getPpt()
  // 加载期间已关闭（或卸载）时，不再开始轮询
  if (dialogVisible.value && pptId === id) {
    startPolling()
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 加载详情；silent 为 true 时不显示加载状态（轮询使用） */
const getPpt = async (silent = false) => {
  if (!pptId) {
    return
  }
  const currentRequestId = ++requestId
  if (!silent) {
    loading.value = true
  }
  try {
    const data = props.readonly ? await PptApi.getPpt(pptId) : await PptApi.getPptMy(pptId)
    if (currentRequestId !== requestId || !dialogVisible.value) {
      return
    }
    const wasRunning = isRunning.value
    ppt.value = data
    if (currentIndex.value >= slides.value.length) {
      currentIndex.value = Math.max(slides.value.length - 1, 0)
    }
    // 轮询到结束：通知列表刷新
    if (wasRunning && !isRunning.value) {
      emit('refresh')
    }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

/** 本页当前版本的完整提示词：重绘过的取对应版本，否则取分镜的提示词 */
const getCurrentPrompt = (slide: PptSlideVO) => {
  const image = slide.images?.find((item) => item.url === slide.imageUrl)
  return image?.prompt || slide.imagePrompt
}

// ========== 修改本页 ==========

const editVisible = ref(false) // 修改抽屉的是否展示
const editPrompt = ref('') // 编辑中的生图提示词

/** 打开修改本页：带入本页当前版本的提示词 */
const openEdit = () => {
  if (!currentSlide.value) {
    return
  }
  editPrompt.value = getCurrentPrompt(currentSlide.value)
  editVisible.value = true
}

/** 重新生成：异步重绘，任务回到生成中 */
const redrawing = ref(false) // 重绘提交中
const handleRedraw = async () => {
  if (!ppt.value || !currentSlide.value) {
    return
  }
  const prompt = editPrompt.value.trim()
  if (!prompt) {
    message.warning('请输入生图提示词')
    return
  }
  redrawing.value = true
  try {
    await PptApi.redrawSlideMy({ id: ppt.value.id, slideIndex: currentSlide.value.index, prompt })
    message.success('已提交重绘')
    emit('refresh')
    await getPpt(true)
  } finally {
    redrawing.value = false
  }
}

/** 切换历史版本：立即设为当前，不重新生成 */
const handleSwitchImage = async (image: PptSlideImageVO) => {
  if (!ppt.value || !currentSlide.value || image.url === currentSlide.value.imageUrl) {
    return
  }
  if (isRunning.value) {
    message.warning('任务生成中，请稍后再切换')
    return
  }
  await PptApi.updateSlideImageMy({
    id: ppt.value.id,
    slideIndex: currentSlide.value.index,
    imageUrl: image.url
  })
  message.success('已设为当前版本')
  emit('refresh')
  await getPpt(true)
}

// ========== 导出 ==========

const exporting = ref(false) // 导出中
const handleExport = async (format: AiPptExportFormatEnum) => {
  if (!ppt.value) {
    return
  }
  exporting.value = true
  try {
    const data = await PptApi.exportPptMy(ppt.value.id, format)
    download[format](data, `${ppt.value.title}.${format}`)
  } finally {
    exporting.value = false
  }
}

// ========== 轮询 ==========

let pollTimer: ReturnType<typeof setInterval> | undefined // 轮询定时器
let polling = false // 静默轮询是否进行中：上一次未返回时不再发起
/** 开始轮询：任务生成中时，静默刷新详情 */
const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(async () => {
    if (!dialogVisible.value || !isRunning.value || loading.value || polling) {
      return
    }
    polling = true
    try {
      await getPpt(true)
    } finally {
      polling = false
    }
  }, POLL_INTERVAL)
}

/** 停止轮询 */
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = undefined
  }
}

/** 关闭：停止轮询 */
const handleClosed = () => {
  stopPolling()
  editVisible.value = false
  pptId = undefined
}
onBeforeUnmount(handleClosed)
</script>
