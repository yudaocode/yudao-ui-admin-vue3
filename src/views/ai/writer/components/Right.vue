<template>
  <div class="h-full box-border py-6 px-7">
    <div class="w-full h-full relative bg-white box-border p-3 sm:p-16 pr-0">
      <!-- 展示在右上角 -->
      <el-button
        color="#846af7"
        v-show="showCopy"
        @click="copyContent"
        class="absolute top-2 right-2"
      >
        复制
      </el-button>
      <!-- 展示在下面中间的位置 -->
      <el-button
        v-show="isWriting"
        class="absolute bottom-2 left-1/2 -translate-x-1/2"
        @click="emits('stopStream')"
      >
        终止生成
      </el-button>
      <div ref="contentRef" class="w-full h-full pr-3 sm:pr-16 overflow-y-auto">
        <el-input
          id="inputId"
          type="textarea"
          v-model="compContent"
          autosize
          :input-style="{ boxShadow: 'none' }"
          resize="none"
          placeholder="生成的内容……"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const message = useMessage()
const { copied, copy } = useClipboard()

const props = defineProps({
  content: {
    // 生成的结果
    type: String,
    default: ''
  },
  isWriting: {
    // 是否正在生成文章
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['update:content', 'stopStream'])

// 通过计算属性，双向绑定，更改生成的内容，考虑到用户想要更改生成文章的情况
const compContent = computed({
  get() {
    return props.content
  },
  set(val) {
    emits('update:content', val)
  }
})

/** 滚动 */
const contentRef = ref<HTMLDivElement>()
defineExpose({
  scrollToBottom() {
    contentRef.value?.scrollTo(0, contentRef.value?.scrollHeight)
  }
})

/** 点击复制的时候复制内容 */
const showCopy = computed(() => props.content && !props.isWriting) // 是否展示复制按钮，在生成内容完成的时候展示
const copyContent = () => {
  copy(props.content)
}

// 复制成功的时候copied.value为true
watch(copied, (val) => {
  if (val) {
    message.success('复制成功')
  }
})
</script>
