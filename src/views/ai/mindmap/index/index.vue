<template>
  <div class="absolute top-0 left-0 right-0 bottom-0 flex">
    <!--表单区域-->
    <Left
      ref="leftRef"
      @submit="submit"
      @direct-generate="directGenerate"
      :is-generating="isGenerating"
    />
    <!--右边生成思维导图区域-->
    <Right
      ref="rightRef"
      :mindmapResult="mindmapResult"
      :isEnd="isEnd"
      :isGenerating="isGenerating"
      :isStart="isStart"
    />
  </div>
</template>

<script setup lang="ts">
import Left from './components/Left.vue'
import Right from './components/Right.vue'
import { AiMindMapApi, AiMindMapGenerateReqVO } from '@/api/ai/mindmap'
import { MindMapContentExample } from '@/views/ai/utils/constants'

defineOptions({
  name: 'AiMindMap'
})
const ctrl = ref<AbortController>() // 请求控制
const isGenerating = ref(false) // 是否正在生成思维导图
const isStart = ref(false) // 开始生成，用来清空思维导图
const isEnd = ref(true) // 用来判断结束的时候渲染思维导图
const message = useMessage() // 消息提示

const mindmapResult = ref('') // 生成思维导图结果

const leftRef = ref<InstanceType<typeof Left>>() // 左边组件
const rightRef = ref<InstanceType<typeof Right>>() // 右边组件

/** 使用已有内容直接生成 **/
const directGenerate = (existPrompt: string) => {
  isEnd.value = false // 先设置为false再设置为true，让子组建的watch能够监听到
  mindmapResult.value = existPrompt
  isEnd.value = true
}

/** 停止 stream 生成 */
const stopStream = () => {
  isGenerating.value = false
  isStart.value = false
  ctrl.value?.abort()
}

/** 提交生成 */
const submit = (data: AiMindMapGenerateReqVO) => {
  isGenerating.value = true
  isStart.value = true
  isEnd.value = false
  ctrl.value = new AbortController() // 请求控制赋值
  mindmapResult.value = '' // 清空生成数据
  AiMindMapApi.generateMindMap({
    data,
    onMessage: async (res) => {
      const { code, data, msg } = JSON.parse(res.data)
      if (code !== 0) {
        message.alert(`生成思维导图异常! ${msg}`)
        stopStream()
        return
      }
      mindmapResult.value = mindmapResult.value + data
      await nextTick()
      rightRef.value?.scrollBottom()
    },
    onClose() {
      isEnd.value = true
      leftRef.value?.setGeneratedContent(mindmapResult.value)
      stopStream()
    },
    onError(err) {
      console.error('生成思维导图失败', err)
      stopStream()
    },
    ctrl: ctrl.value
  })
}

/** 初始化 */
onMounted(() => {
  mindmapResult.value = MindMapContentExample
})
</script>
