<template>
  <el-card class="my-card h-full">
    <template #header>
      <h3 class="m-0 px-7 shrink-0 flex items-center justify-between">
        <span>预览</span>
        <!-- 展示在右上角 -->
        <div class="flex items-center gap-8px">
          <TokenUsage
            v-if="usage"
            :pending="isWriting"
            :input-tokens="usage.inputTokens"
            :output-tokens="usage.outputTokens"
            :total-tokens="usage.totalTokens"
          />
          <el-button type="primary" v-show="showCopy" @click="copyContent" size="small">
            <template #icon>
              <Icon icon="ph:copy-bold" />
            </template>
            复制
          </el-button>
        </div>
      </h3>
    </template>

    <div class="hide-scroll-bar h-full box-border overflow-y-auto">
      <!-- 编辑框撑满预览区、内部滚动（与 OCR 识别结果一致），不依赖 autosize 测量，避免文字被裁切 -->
      <div class="w-full h-full relative flex flex-col bg-white box-border p-3 sm:p-7">
        <!-- 终止生成内容的按钮 -->
        <el-button
          v-show="isWriting"
          class="absolute bottom-2 sm:bottom-5 left-1/2 -translate-x-1/2 z-36"
          @click="emits('stopStream')"
          size="small"
        >
          <template #icon>
            <Icon icon="material-symbols:stop" />
          </template>
          终止生成
        </el-button>
        <el-input
          id="inputId"
          ref="inputRef"
          type="textarea"
          v-model="compContent"
          class="write-text min-h-0 flex-1"
          :input-style="{ boxShadow: 'none' }"
          resize="none"
          placeholder="生成的内容……"
        />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { AiWriteGenerateRespVO } from '@/api/ai/write'
import TokenUsage from '@/views/ai/components/TokenUsage.vue'

const message = useMessage() // 消息弹窗
const { copied, copy } = useClipboard({ legacy: true }) // 粘贴板

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
  },
  usage: {
    // 最近一帧的生成结果，用于展示 Token 用量；为空时（示例、重置）不展示
    type: Object as PropType<AiWriteGenerateRespVO>,
    default: undefined
  }
})

const emits = defineEmits(['update:content', 'stopStream'])

/** 通过计算属性，双向绑定，更改生成的内容，考虑到用户想要更改生成文章的情况 */
const compContent = computed({
  get() {
    return props.content
  },
  set(val) {
    emits('update:content', val)
  }
})

/** 滚动：编辑框内部滚动，生成过程中滚到底部 */
const inputRef = ref()
defineExpose({
  scrollToBottom() {
    const textarea: HTMLTextAreaElement | undefined = inputRef.value?.textarea
    textarea?.scrollTo(0, textarea.scrollHeight)
  }
})

/** 点击复制的时候复制内容 */
const showCopy = computed(() => props.content && !props.isWriting) // 是否展示复制按钮，在生成内容完成的时候展示
const copyContent = () => {
  copy(props.content)
}

/** 复制成功的时候 copied.value 为 true */
watch(copied, (val) => {
  if (val) {
    message.success('复制成功')
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

.write-text {
  :deep(.el-textarea__inner) {
    height: 100%;
  }
}

.my-card {
  display: flex;
  flex-direction: column;

  :deep(.el-card__body) {
    @extend .hide-scroll-bar;

    padding: 0;
    overflow-y: auto;
    box-sizing: border-box;
    flex-grow: 1;
  }
}
</style>
