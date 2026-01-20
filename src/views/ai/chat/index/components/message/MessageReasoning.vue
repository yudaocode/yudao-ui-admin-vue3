<template>
  <div v-if="shouldShowComponent" class="mt-10px">
    <!-- 推理过程标题栏 -->
    <div
      class="flex items-center justify-between cursor-pointer p-8px rounded-t-8px bg-gradient-to-r from-blue-50 to-purple-50 border border-b-0 border-gray-200/60 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
      @click="toggleExpanded"
    >
      <div class="flex items-center gap-6px text-14px font-medium text-gray-700">
        <el-icon :size="16" class="text-blue-600">
          <ChatDotSquare />
        </el-icon>
        <span>{{ titleText }}</span>
      </div>
      <el-icon
        :size="14"
        class="text-gray-500 transition-transform duration-200"
        :class="{ 'transform rotate-180': isExpanded }"
      >
        <ArrowDown />
      </el-icon>
    </div>

    <!-- 推理内容区域 -->
    <div
      v-show="isExpanded"
      class="max-h-300px overflow-y-auto p-12px bg-white/70 backdrop-blur-sm border border-t-0 border-gray-200/60 rounded-b-8px shadow-sm"
    >
      <MarkdownView
        v-if="props.reasoningContent"
        class="text-gray-700 text-13px leading-relaxed"
        :content="props.reasoningContent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowDown, ChatDotSquare } from '@element-plus/icons-vue'
import MarkdownView from '@/components/MarkdownView/index.vue'

// 定义 props
const props = defineProps<{
  reasoningContent?: string
  content?: string
}>()

const isExpanded = ref(true) // 默认展开

/** 计算属性：判断是否应该显示组件（有思考内容时，则展示） */
const shouldShowComponent = computed(() => {
  return !(!props.reasoningContent || props.reasoningContent.trim() === '')
})

/** 计算属性：标题文本 */
const titleText = computed(() => {
  const hasReasoningContent = props.reasoningContent && props.reasoningContent.trim() !== ''
  const hasContent = props.content && props.content.trim() !== ''
  if (hasReasoningContent && !hasContent) {
    return '深度思考中'
  }
  return '已深度思考'
})

/** 切换展开/收缩状态 */
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
/* 自定义滚动条样式 */
.max-h-300px::-webkit-scrollbar {
  width: 4px;
}

.max-h-300px::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-300px::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 2px;
}

.max-h-300px::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.6);
}
</style>
