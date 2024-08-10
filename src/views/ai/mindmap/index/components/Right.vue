<template>
  <el-card class="my-card h-full flex-grow">
    <template #header>
      <h3 class="m-0 px-7 shrink-0 flex items-center justify-between">
        <span>思维导图预览</span>
        <!-- 展示在右上角 -->
        <el-button type="primary" v-show="isEnd" @click="downloadImage" size="small">
          <template #icon>
            <Icon icon="ph:copy-bold" />
          </template>
          下载图片
        </el-button>
      </h3>
    </template>

    <div ref="contentRef" class="hide-scroll-bar h-full box-border">
      <!--展示 markdown 的容器，最终生成的是 html 字符串，直接用 v-html 嵌入-->
      <div v-if="isGenerating" ref="mdContainerRef" class="wh-full overflow-y-auto">
        <div class="flex flex-col items-center justify-center" v-html="html"></div>
      </div>

      <div ref="mindMapRef" class="wh-full">
        <svg ref="svgRef" class="w-full" :style="{ height: `${contentAreaHeight}px` }" />
        <div ref="toolBarRef" class="absolute bottom-[10px] right-5"></div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'
import { Toolbar } from 'markmap-toolbar'
import markdownit from 'markdown-it'
import download from '@/utils/download'

const md = markdownit()
const message = useMessage() // 消息弹窗

const props = defineProps<{
  generatedContent: string // 生成结果
  isEnd: boolean // 是否结束
  isGenerating: boolean // 是否正在生成
  isStart: boolean // 开始状态，开始时需要清除 html
}>()
const contentRef = ref<HTMLDivElement>() // 右侧出来 header 以下的区域
const mdContainerRef = ref<HTMLDivElement>() // markdown 的容器，用来滚动到底下的
const mindMapRef = ref<HTMLDivElement>() // 思维导图的容器
const svgRef = ref<SVGElement>() // 思维导图的渲染 svg
const toolBarRef = ref<HTMLDivElement>() // 思维导图右下角的工具栏，缩放等
const html = ref('') // 生成过程中的文本
const contentAreaHeight = ref(0) // 生成区域的高度，出去 header 部分
let markMap: Markmap | null = null
const transformer = new Transformer()

onMounted(() => {
  contentAreaHeight.value = contentRef.value?.clientHeight || 0 // 获取区域高度
  /** 初始化思维导图 **/
  try {
    markMap = Markmap.create(svgRef.value!)
    const { el } = Toolbar.create(markMap)
    toolBarRef.value?.append(el)
    nextTick(update)
  } catch (e) {
    message.error('思维导图初始化失败')
  }
})

watch(props, ({ generatedContent, isGenerating, isEnd, isStart }) => {
  // 开始生成的时候清空一下 markdown 的内容
  if (isStart) {
    html.value = ''
  }
  // 生成内容的时候使用 markdown 来渲染
  if (isGenerating) {
    html.value = md.render(generatedContent)
  }
  // 生成结束时更新思维导图
  if (isEnd) {
    update()
  }
})

/** 更新思维导图的展示 */
const update = () => {
  try {
    const { root } = transformer.transform(processContent(props.generatedContent))
    markMap?.setData(root)
    markMap?.fit()
  } catch (e) {
    console.error(e)
  }
}

/** 处理内容 */
const processContent = (text: string) => {
  const arr: string[] = []
  const lines = text.split('\n')
  for (let line of lines) {
    if (line.indexOf('```') !== -1) {
      continue
    }
    line = line.replace(/([*_~`>])|(\d+\.)\s/g, '')
    arr.push(line)
  }
  return arr.join('\n')
}

/** 下载图片：download SVG to png file */
const downloadImage = () => {
  const svgElement = mindMapRef.value
  // 将 SVG 渲染到图片对象
  const serializer = new XMLSerializer()
  const source = `<?xml version="1.0" standalone="no"?>\r\n${serializer.serializeToString(svgRef.value!)}`
  const base64Url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
  download.image({
    url: base64Url,
    canvasWidth: svgElement?.offsetWidth,
    canvasHeight: svgElement?.offsetHeight,
    drawWithImageSize: false
  })
}

defineExpose({
  scrollBottom() {
    mdContainerRef.value?.scrollTo(0, mdContainerRef.value?.scrollHeight)
  }
})
</script>
<style lang="scss" scoped>
.hide-scroll-bar {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}
.my-card {
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    box-sizing: border-box;
    flex-grow: 1;
    overflow-y: auto;
    padding: 0;
    @extend .hide-scroll-bar;
  }
}
// markmap的tool样式覆盖
:deep(.markmap) {
  width: 100%;
}
:deep(.mm-toolbar-brand) {
  display: none;
}
:deep(.mm-toolbar) {
  display: flex;
  flex-direction: row;
}
</style>
