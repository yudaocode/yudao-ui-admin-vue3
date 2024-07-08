<!-- TODO @hhhero：挪到 write/index/index.vue 里。因为后续会有 write/manager/index.vue 管理内容 -->
<template>
  <div class="h-[calc(100vh-var(--top-tool-height)-var(--app-footer-height)-40px)] -m-5 flex">
    <Left :is-writing="isWriting" class="h-full" @submit="submit" @example="handleExampleClick" />
    <!-- TODO @hhhero：顶部应该有个预览的 header -->
    <!-- TODO @hhhero：整个 Right 组件的框，没铺满的感觉？ -->
    <Right
      :is-writing="isWriting"
      @stop-stream="stopStream"
      ref="rightRef"
      class="flex-grow"
      v-model:msg="writeResult"
    />
  </div>
</template>

<script setup lang="ts">
import Left from './components/Left.vue'
import Right from './components/Right.vue'
// TODO @hhhero：搞成 WriteApi 哈
import { writeStream } from '@/api/ai/writer'
// TODO @hhhero：dataJson 放到 ai/utils/utils.ts
import dataJson from './data.json'

const message = useMessage()

const writeResult = ref('') // 写作结果
const isWriting = ref(false) // 是否正在写作中
const abortController = ref<AbortController>() // // 写作进行中 abort 控制器(控制 stream 写作)

/** 停止 stream 生成 */
const stopStream = () => {
  abortController.value?.abort()
  isWriting.value = false
}

/** 执行写作 */
const rightRef = ref<InstanceType<typeof Right>>()
const submit = async (data) => {
  abortController.value = new AbortController()
  writeResult.value = ''
  isWriting.value = true
  await writeStream({
    data,
    onMessage: async (res) => {
      const { code, data, msg } = JSON.parse(res.data)
      if (code !== 0) {
        message.alert(`写作异常! ${msg}`)
        stopStream()
        return
      }
      writeResult.value = writeResult.value + data
      nextTick(() => {
        rightRef.value?.scrollToBottom()
      })
    },
    ctrl: abortController.value,
    onClose: stopStream,
    onError: stopStream // TODO @hhhero: error 的时候，是不是要打印下错误哈
  })
}

/** 点击示例触发 */
const handleExampleClick = (type: keyof typeof dataJson) => {
  writeResult.value = dataJson[type].data
}
</script>
