<template>
  <div>
    <!-- 文件处理列表 -->
    <div class="mt-15px grid grid-cols-1 gap-2">
      <div
        v-for="(file, index) in modelValue.list"
        :key="index"
        class="flex items-center py-4px px-12px border-l-4 border-l-[#409eff] rounded-sm shadow-sm hover:bg-[#ecf5ff] transition-all duration-300"
      >
        <!-- 文件图标和名称 -->
        <div class="flex items-center min-w-[200px] mr-10px">
          <Icon icon="ep:document" class="mr-8px text-[#409eff]" />
          <span class="text-[13px] text-[#303133] break-all">{{ file.name }}</span>
        </div>

        <!-- 处理进度 -->
        <div class="flex-1">
          <el-progress
            :percentage="file.progress || 0"
            :stroke-width="10"
            :status="isProcessComplete(file) ? 'success' : ''"
          />
        </div>

        <!-- 分段数量 -->
        <div class="ml-10px text-[13px] text-[#606266]">
          分段数量：{{ file.count ? file.count : '-' }}
        </div>
      </div>
    </div>

    <!-- 底部完成按钮 -->
    <div class="flex justify-end mt-20px">
      <el-button
        :type="allProcessComplete ? 'success' : 'primary'"
        :disabled="!allProcessComplete"
        @click="handleComplete"
      >
        完成
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { KnowledgeSegmentApi } from '@/api/ai/knowledge/segment'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
const parent = inject('parent') as any
const pollingTimer = ref<number | null>(null) // 轮询定时器 ID，用于跟踪和清除轮询进程

/** 判断文件处理是否完成 */
const isProcessComplete = (file) => {
  return file.progress === 100
}

/** 判断所有文件是否都处理完成 */
const allProcessComplete = computed(() => {
  return props.modelValue.list.every((file) => isProcessComplete(file))
})

/** 完成按钮点击事件处理 */
const handleComplete = () => {
  if (parent?.exposed?.handleBack) {
    parent.exposed.handleBack()
  }
}

/** 获取文件处理进度 */
const getProcessList = async () => {
  try {
    // 1. 调用 API 获取处理进度
    const documentIds = props.modelValue.list.filter((item) => item.id).map((item) => item.id)
    if (documentIds.length === 0) {
      return
    }
    const result = await KnowledgeSegmentApi.getKnowledgeSegmentProcessList(documentIds)

    // 2.1更新进度
    const updatedList = props.modelValue.list.map((file) => {
      const processInfo = result.find((item) => item.documentId === file.id)
      if (processInfo) {
        // 计算进度百分比：已嵌入数量 / 总数量 * 100
        const progress =
          processInfo.embeddingCount && processInfo.count
            ? Math.floor((processInfo.embeddingCount / processInfo.count) * 100)
            : 0
        return {
          ...file,
          progress: progress,
          count: processInfo.count || 0
        }
      }
      return file
    })

    // 2.2 更新数据
    emit('update:modelValue', {
      ...props.modelValue,
      list: updatedList
    })

    // 3. 如果未完成，继续轮询
    if (!updatedList.every((file) => isProcessComplete(file))) {
      pollingTimer.value = window.setTimeout(getProcessList, 3000)
    }
  } catch (error) {
    // 出错后也继续轮询
    console.error('获取处理进度失败:', error)
    pollingTimer.value = window.setTimeout(getProcessList, 5000)
  }
}

/** 组件挂载时开始轮询 */
onMounted(() => {
  // 1. 初始化进度为 0
  const initialList = props.modelValue.list.map((file) => ({
    ...file,
    progress: 0
  }))

  emit('update:modelValue', {
    ...props.modelValue,
    list: initialList
  })

  // 2. 开始轮询获取进度
  getProcessList()
})

/** 组件卸载前清除轮询 */
onBeforeUnmount(() => {
  // 1. 清除定时器
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value)
    pollingTimer.value = null
  }
})
</script>
