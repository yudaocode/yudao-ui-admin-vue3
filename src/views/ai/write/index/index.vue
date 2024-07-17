<template>
  <div class="absolute top-0 left-0 right-0 bottom-0 flex">
    <Left
      :is-writing="isWriting"
      class="h-full"
      @submit="submit"
      @reset="reset"
      @example="handleExampleClick"
    />
    <Right
      :is-writing="isWriting"
      @stop-stream="stopStream"
      ref="rightRef"
      class="flex-grow"
      v-model:content="writeResult"
    />
  </div>
</template>

<script setup lang="ts">
import Left from './components/Left.vue'
import Right from './components/Right.vue'
import { WriteApi, WriteVO } from '@/api/ai/write'
import { WriteExample } from '@/views/ai/utils/constants'

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
const submit = (data: WriteVO) => {
  abortController.value = new AbortController()
  writeResult.value = ''
  isWriting.value = true
  WriteApi.writeStream({
    data,
    onMessage: async (res) => {
      const { code, data, msg } = JSON.parse(res.data)
      if (code !== 0) {
        message.alert(`写作异常! ${msg}`)
        stopStream()
        return
      }
      writeResult.value = writeResult.value + data
      // 滚动到底部
      await nextTick()
      rightRef.value?.scrollToBottom()
    },
    ctrl: abortController.value,
    onClose: stopStream,
    onError: (...err) => {
      console.error('写作异常', ...err)
      stopStream()
    }
  })
}

/** 点击示例触发 */
const handleExampleClick = (type: keyof typeof WriteExample) => {
  writeResult.value = WriteExample[type].data
}

/** 点击重置的时候清空写作的结果**/
const reset = () => {
  writeResult.value = ''
}
</script>
