<template>
  <div class="absolute top-0 left-0 right-0 bottom-0 flex flex-col">
    <doc-alert title="AI 写作翻译" url="https://doc.iocoder.cn/ai/write/" />
    <div class="min-h-0 flex flex-1 gap-16px">
      <div class="h-full w-380px flex-shrink-0">
        <Left
          :is-writing="isWriting"
          @submit="submit"
          @reset="reset"
          @example="handleExampleClick"
        />
      </div>
      <Right
        :is-writing="isWriting"
        @stop-stream="stopStream"
        ref="rightRef"
        class="min-w-0 flex-1"
        v-model:content="writeResult"
        :usage="writeResp"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Left from './components/Left.vue'
import Right from './components/Right.vue'
import { AiWriteGenerateRespVO, WriteApi, WriteVO } from '@/api/ai/write'
import { AiWriteTypeEnum, WriteExample } from '@/views/ai/utils/constants'

defineOptions({ name: 'AiWrite' })

const message = useMessage()

const writeResult = ref('') // 写作结果
const isWriting = ref(false) // 是否正在写作中
const abortController = ref<AbortController>() // // 写作进行中 abort 控制器(控制 stream 写作)
const writeResp = ref<AiWriteGenerateRespVO>() // 最近一帧的生成结果，用于展示 Token 用量；示例、重置时为空，不展示

/** 停止 stream 生成 */
const stopStream = () => {
  abortController.value?.abort()
  isWriting.value = false
}

/** 执行写作：不自动重试 */
const rightRef = ref<InstanceType<typeof Right>>()
const submit = (data: WriteVO) => {
  if (isWriting.value) {
    return
  }
  abortController.value = new AbortController()
  writeResult.value = ''
  writeResp.value = undefined
  isWriting.value = true
  WriteApi.writeStream({
    data,
    onMessage: async (res) => {
      const { code, data, msg } = JSON.parse(res.data)
      // 业务错误帧（参数不正确、模型不可用、上游失败等）：提示原因并结束
      if (code !== 0) {
        message.error(msg || '写作失败')
        stopStream()
        return
      }
      // Token 取最新快照，不累加；仅携带用量的尾帧 content 为空字符串
      writeResp.value = data
      if (!data.content) {
        return
      }
      writeResult.value = writeResult.value + data.content
      // 滚动到底部
      await nextTick()
      rightRef.value?.scrollToBottom()
    },
    ctrl: abortController.value,
    onClose: stopStream,
    onError: (error) => {
      // 网络异常、非 SSE 响应（库默认的 onopen 已校验）等
      console.error('写作异常', error)
      if (isWriting.value) {
        message.error('写作失败，请稍后重试')
      }
      stopStream()
      // 需要抛出异常，禁止重试
      throw error
    }
  }).catch(() => {
    // 已在 onError 中提示，这里只避免未处理的 Promise 异常
  })
}

/** 点击示例：撰写 / 回复在预览显示示例正文；新场景只填表单 */
const handleExampleClick = (type: AiWriteTypeEnum) => {
  const example = WriteExample[type]
  writeResult.value = 'data' in example ? example.data : ''
  writeResp.value = undefined // 示例内容不是模型生成，不展示用量
}

/** 点击重置的时候清空写作的结果**/
const reset = () => {
  writeResult.value = ''
  writeResp.value = undefined
}

/** 卸载：取消生成；keep-alive 切换菜单不会卸载，也不重置 */
onBeforeUnmount(() => {
  abortController.value?.abort()
})
</script>
