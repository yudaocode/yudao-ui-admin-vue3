<template>
  <div class="absolute top-0 left-0 right-0 bottom-0 flex flex-col">
    <doc-alert title="AI 思维导图" url="https://doc.iocoder.cn/ai/mindmap/" />
    <div class="min-h-0 flex flex-1 gap-16px">
      <!--表单区域-->
      <div class="h-full w-380px flex-shrink-0">
        <Left
          ref="leftRef"
          :is-generating="isGenerating"
          @submit="submit"
          @direct-generate="directGenerate"
        />
      </div>
      <!--右边生成思维导图区域-->
      <div class="h-full min-w-0 flex-1">
        <Right
          ref="rightRef"
          :content="canvasContent"
          :stream-content="streamContent"
          :is-generating="isGenerating"
          :status="status"
          :input-tokens="usage?.inputTokens"
          :output-tokens="usage?.outputTokens"
          :total-tokens="usage?.totalTokens"
          :show-usage="showUsage"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Left from './components/Left.vue'
import Right from './components/Right.vue'
import { AiMindMapApi, AiMindMapGenerateReqVO } from '@/api/ai/mindmap'
import { MindMapContentExample } from '@/views/ai/utils/constants'
import type { MindMapStatus } from '@/views/ai/utils/mindmap'

defineOptions({
  name: 'AiMindMap'
})

const message = useMessage() // 消息提示

const leftRef = ref<InstanceType<typeof Left>>() // 左边组件
const rightRef = ref<InstanceType<typeof Right>>() // 右边组件

// 以下状态只在当前页面内存：keep-alive 切换菜单保留，刷新、关闭页签、重新登录后不恢复
const canvasContent = ref(MindMapContentExample) // 画布渲染的 Markdown；首次进入为内置示例
const streamContent = ref('') // 本次生成的流式内容
const isGenerating = ref(false) // 是否正在生成
const status = ref<MindMapStatus>('') // 状态标签
const usage = ref<{
  inputTokens: number | null
  outputTokens: number | null
  totalTokens: number | null
} | null>(null) // 本次请求的 Token 快照，不归属画布上的旧导图
const showUsage = ref(false) // 只有 AI 生成的请求展示 Token

let ctrl: AbortController | undefined // 当前生成的请求控制，卸载时取消

/** 使用已有 Markdown 直接渲染：不调模型、不展示 Token、不落库 */
const directGenerate = (content: string) => {
  if (!content || !content.trim()) {
    message.warning('请输入 Markdown 内容')
    return
  }
  canvasContent.value = content
  status.value = ''
  usage.value = null
  showUsage.value = false
}

/** 生成失败：画布仍是原来的导图，不回填文本框 */
const finishFail = (msg: string) => {
  if (!isGenerating.value) {
    return
  }
  isGenerating.value = false
  status.value = 'fail'
  message.error(msg)
}

/** 正常结束：非空结果交给画布并回填“已有 Markdown”；空结果保留原来的导图 */
const finishClose = () => {
  if (!isGenerating.value) {
    return
  }
  isGenerating.value = false
  const content = streamContent.value
  if (!content.trim()) {
    status.value = 'empty'
    message.warning('生成结果为空，请重试或更换模型')
    return
  }
  status.value = 'success'
  canvasContent.value = content
  leftRef.value?.setMarkdown(content)
}

/** 提交 AI 生成：不自动重试 */
const submit = (data: AiMindMapGenerateReqVO) => {
  if (isGenerating.value) {
    return
  }
  isGenerating.value = true
  status.value = 'generating'
  streamContent.value = ''
  usage.value = null
  showUsage.value = true
  const controller = new AbortController()
  ctrl = controller
  AiMindMapApi.generateMindMap({
    data,
    onMessage: async (res) => {
      const { code, data, msg } = JSON.parse(res.data)
      // 业务错误帧（模型不可用、上游失败等）：提示原因并结束
      if (code !== 0) {
        finishFail(msg || '生成失败')
        controller.abort()
        return
      }
      // Token 取最新快照，不累加；仅携带用量的尾帧 content 为空字符串
      usage.value = {
        inputTokens: data?.inputTokens ?? null,
        outputTokens: data?.outputTokens ?? null,
        totalTokens: data?.totalTokens ?? null
      }
      if (!data?.content) {
        return
      }
      streamContent.value = streamContent.value + data.content
      await nextTick()
      rightRef.value?.scrollBottom()
    },
    onClose() {
      finishClose()
    },
    onError(err) {
      // 网络异常、非 SSE 响应（库默认的 onopen 已校验）等
      console.error('生成思维导图失败', err)
      finishFail('生成失败，请稍后重试')
      // 需要抛出异常，禁止重试
      throw err
    },
    ctrl: controller
  }).catch(() => {
    // 已在 onError 中提示，这里只避免未处理的 Promise 异常
  })
}

/** 卸载：取消生成；keep-alive 切换菜单不会卸载，也不重置 */
onBeforeUnmount(() => {
  ctrl?.abort()
})
</script>
