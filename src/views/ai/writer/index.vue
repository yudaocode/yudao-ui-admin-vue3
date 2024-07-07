<template>
  <div class="h-[calc(100vh-var(--top-tool-height)-var(--app-footer-height)-40px)] -m-5 flex">
    <Left :is-writing="isWriting" class="h-full" @submit="submit" @example="example" />
    <Right
      :is-writing="isWriting"
      @stop-stream="stopStream"
      ref="rightRef"
      class="flex-grow"
      v-model:msg="msgResult"
    />
  </div>
</template>

<script setup lang="ts">
  import Left from './components/Left.vue'
  import Right from './components/Right.vue'
  import { writeStream } from '@/api/ai/writer'
  import dataJson from './data.json'

  const message = useMessage()
  const msgResult = ref('')
  const isWriting = ref(false)

  const abortController = ref<AbortController>()

  const stopStream = () => {
    abortController.value?.abort()
    isWriting.value = false
  }

  const rightRef = ref<InstanceType<typeof Right>>()

  // 点击示例触发
  const example = (type: keyof typeof dataJson) => {
    msgResult.value = dataJson[type].data
  }

  const submit = async (data) => {
    abortController.value = new AbortController()
    msgResult.value = ''
    isWriting.value = true
    writeStream({
      data,
      onMessage: async (res) => {
        const { code, data, msg } = JSON.parse(res.data)
        if (code !== 0) {
          message.alert(`写作异常! ${msg}`)
          stopStream()
          return
        }
        msgResult.value = msgResult.value + data
        nextTick(() => {
          rightRef.value?.scrollToBottom()
        })
      },
      ctrl: abortController.value,
      onClose: stopStream,
      onError: stopStream
    })
  }
</script>
