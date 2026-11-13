<template>
  <el-card
    class="h-full flex flex-col flex-grow"
    body-class="flex-grow min-h-0 !p-0 overflow-hidden box-border"
    shadow="never"
  >
    <template #header>
      <div class="m-0 px-7 shrink-0 flex items-center justify-between gap-12px">
        <div class="flex items-center gap-8px min-w-0">
          <span class="text-16px font-bold">思维导图预览</span>
          <el-tag v-if="statusTag" :type="statusTag.type" size="small" disable-transitions>
            {{ statusTag.label }}
          </el-tag>
        </div>
        <!-- 展示在右上角 -->
        <div class="flex items-center gap-8px">
          <span
            v-if="showUsage && (status === 'fail' || status === 'empty')"
            class="text-12px text-[var(--el-text-color-secondary)] whitespace-nowrap"
          >
            本次请求
          </span>
          <TokenUsage
            v-if="showUsage"
            :pending="isGenerating"
            :input-tokens="inputTokens"
            :output-tokens="outputTokens"
            :total-tokens="totalTokens"
          />
          <template v-if="showDownload">
            <el-tooltip
              content="PNG 只保证文字节点完整；导图中的外链图片可能缺失"
              placement="bottom"
            >
              <Icon icon="ep:info-filled" class="text-[var(--el-text-color-secondary)]" />
            </el-tooltip>
            <el-button
              size="small"
              type="primary"
              :disabled="!canDownload"
              :loading="exporting"
              @click="downloadImage"
            >
              <template #icon>
                <Icon icon="ep:download" />
              </template>
              下载 PNG
            </el-button>
          </template>
        </div>
      </div>
    </template>

    <div ref="contentRef" class="relative h-full box-border">
      <!--生成中：流式展示 Markdown（markdown-it 默认不渲染 HTML）-->
      <div
        v-if="isGenerating"
        ref="mdContainerRef"
        class="absolute inset-0 overflow-y-auto bg-[var(--el-bg-color)] px-24px py-16px"
      >
        <div class="leading-[1.7] break-words" v-html="html"></div>
      </div>

      <div v-show="!isGenerating" class="wh-full relative">
        <svg
          v-show="showCanvas"
          ref="svgRef"
          :style="{ height: `${contentAreaHeight}px` }"
          class="w-full"
        />
        <div
          v-if="!showCanvas"
          class="absolute inset-0 flex items-center justify-center text-14px text-[var(--el-text-color-placeholder)]"
        >
          {{ renderError ? '导图渲染失败' : '暂无导图' }}
        </div>
        <div v-show="showCanvas" ref="toolBarRef" class="absolute bottom-[10px] right-5"></div>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'
import { Toolbar } from 'markmap-toolbar'
import markdownit from 'markdown-it'
import TokenUsage from '@/views/ai/components/TokenUsage.vue'
import {
  type MindMapStatus,
  buildMindMapFileName,
  getMindMapExportScale,
  processMindMapContent
} from '@/views/ai/utils/mindmap'

const md = markdownit()
const message = useMessage() // 消息弹窗

const props = withDefaults(
  defineProps<{
    content?: string | null // 要在画布上渲染的 Markdown；为空表示没有导图
    streamContent?: string // 生成中的 Markdown
    isGenerating?: boolean // 是否正在生成
    status?: MindMapStatus // 状态标签
    inputTokens?: number | null // 业务快照：输入 Token，未知为 null
    outputTokens?: number | null // 业务快照：输出 Token，未知为 null
    totalTokens?: number | null // 业务快照：合计 Token，未知为 null
    showUsage?: boolean // 是否展示 Token 用量：真实生成的请求才展示，示例、手工渲染不展示
    showDownload?: boolean // 是否展示下载按钮
  }>(),
  {
    content: null,
    streamContent: '',
    isGenerating: false,
    status: '',
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
    showUsage: false,
    showDownload: true
  }
)
const contentRef = ref<HTMLDivElement>() // 右侧除 header 以外的区域
const mdContainerRef = ref<HTMLDivElement>() // markdown 的容器，用来滚动到底下的
const svgRef = ref<SVGSVGElement>() // 思维导图的渲染 svg
const toolBarRef = ref<HTMLDivElement>() // 思维导图右下角的工具栏，缩放等
const contentAreaHeight = ref(0) // 画布区域的高度，随容器变化
const exporting = ref(false) // 是否正在导出 PNG
const rootTitle = ref('') // 已渲染导图的根节点内容（HTML），用于导出文件名
const renderError = ref(false) // 当前内容是否渲染失败
let markMap: Markmap | null = null
let resizeObserver: ResizeObserver | null = null
const transformer = new Transformer()

/** 是否有要渲染的导图内容 */
const hasMap = computed(() => !!props.content && props.content.trim().length > 0)
/** 画布是否可见：有内容且渲染成功 */
const showCanvas = computed(() => hasMap.value && !renderError.value)
/** 画布上有渲染成功的导图、且不在生成中，才可下载 */
const canDownload = computed(() => showCanvas.value && !props.isGenerating)
/** 生成中的 Markdown 渲染结果 */
const html = computed(() => (props.isGenerating ? md.render(props.streamContent || '') : ''))

const STATUS_TAGS: Record<
  string,
  { label: string; type: 'primary' | 'success' | 'danger' | 'warning' }
> = {
  generating: { label: '生成中', type: 'primary' },
  success: { label: '已生成', type: 'success' },
  fail: { label: '失败', type: 'danger' },
  empty: { label: '空结果', type: 'warning' }
}
const statusTag = computed(() => STATUS_TAGS[props.status || ''])

onMounted(() => {
  updateHeight()
  // 画布高度随容器变化
  if (typeof ResizeObserver !== 'undefined' && contentRef.value) {
    resizeObserver = new ResizeObserver(() => updateHeight())
    resizeObserver.observe(contentRef.value)
  }
  /** 初始化思维导图 **/
  try {
    markMap = Markmap.create(svgRef.value!)
    const { el } = Toolbar.create(markMap)
    toolBarRef.value?.append(el)
    nextTick(update)
  } catch (e) {
    console.error(e)
    message.error('思维导图初始化失败')
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  markMap?.destroy()
  markMap = null
})

/** 画布内容变化、或生成结束重新显示画布时，重新渲染并适应画布 */
watch(
  () => [props.content, props.isGenerating] as const,
  ([, isGenerating]) => {
    if (!isGenerating) {
      nextTick(update)
    }
  }
)

const updateHeight = () => {
  contentAreaHeight.value = contentRef.value?.clientHeight || 0
}

/** 更新思维导图的展示：渲染失败时明确提示，不显示画布、不可下载 */
const update = async () => {
  renderError.value = false
  rootTitle.value = ''
  if (!markMap || !hasMap.value) {
    return
  }
  try {
    updateHeight()
    const { root } = transformer.transform(processMindMapContent(props.content!))
    await markMap.setData(root)
    await markMap.fit()
    rootTitle.value = root.content || ''
  } catch (e) {
    console.error('思维导图渲染失败', e)
    renderError.value = true
    message.error('导图渲染失败，请检查 Markdown 内容')
  }
}

/** 根节点的 HTML 转为纯文本：DOMParser 不执行脚本、不加载图片 */
const getRootText = () => {
  if (!rootTitle.value) {
    return ''
  }
  return new DOMParser().parseFromString(rootTitle.value, 'text/html').body.textContent || ''
}

/** 加载 SVG 图片 */
const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('SVG 加载失败'))
    image.src = url
  })

/** 下载 PNG：先等适应画布完成，再按像素预算导出白底 PNG；失败明确提示，不下载空图 */
const downloadImage = async () => {
  if (!canDownload.value || !markMap || !svgRef.value) {
    return
  }
  exporting.value = true
  try {
    // 1. 等适应画布的过渡完成
    await markMap.fit()
    // 2. 计算导出尺寸：目标 4 倍，超出像素预算自动降倍
    const svgElement = svgRef.value
    const { width, height } = svgElement.getBoundingClientRect()
    const scale = getMindMapExportScale(width, height)
    if (!scale) {
      throw new Error(`导出尺寸超出预算：${width} x ${height}`)
    }
    // 3. 序列化 SVG
    const clone = svgElement.cloneNode(true) as SVGSVGElement
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clone.setAttribute('width', String(width))
    clone.setAttribute('height', String(height))
    const source = new XMLSerializer().serializeToString(clone)
    const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`)
    // 4. 绘制到白底画布
    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(width * scale)
    canvas.height = Math.floor(height * scale)
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('浏览器不支持 canvas')
    }
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) {
      throw new Error('导出结果为空')
    }
    // 5. 下载：文件名取根标题
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = buildMindMapFileName(getRootText())
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) {
    console.error('导出思维导图失败', e)
    message.error('导图过大或浏览器不支持，导出失败')
  } finally {
    exporting.value = false
  }
}

defineExpose({
  scrollBottom() {
    mdContainerRef.value?.scrollTo(0, mdContainerRef.value?.scrollHeight)
  }
})
</script>
<style lang="scss" scoped>
// markmap 工具栏由第三方脚本生成，不在模板里，只能用 :deep 覆盖
:deep(.mm-toolbar-brand) {
  display: none;
}

:deep(.mm-toolbar) {
  display: flex;
  flex-direction: row;
}
</style>
