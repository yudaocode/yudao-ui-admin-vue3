<template>
  <div
    class="relative inline-block"
    @mouseenter="showTooltipHandler"
    @mouseleave="hideTooltipHandler"
  >
    <!-- 文件上传按钮 -->
    <el-button
      v-if="!disabled"
      circle
      size="small"
      class="upload-btn relative transition-all-200ms"
      :class="{ 'has-files': fileList.length > 0 }"
      @click="triggerFileInput"
      :disabled="fileList.length >= limit"
    >
      <Icon icon="ep:paperclip" :size="16" />
      <!-- 文件数量徽章 -->
      <span
        v-if="fileList.length > 0"
        class="absolute -top-1 -right-1 bg-red-500 text-white text-10px px-1 rounded-8px min-w-4 h-4 flex items-center justify-center leading-none font-medium"
      >
        {{ fileList.length }}
      </span>
    </el-button>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      multiple
      style="display: none"
      :accept="acceptTypes"
      @change="handleFileSelect"
    />

    <!-- Hover 显示的文件列表 -->
    <div
      v-if="fileList.length > 0 && showTooltip"
      class="file-tooltip"
      @mouseenter="showTooltipHandler"
      @mouseleave="hideTooltipHandler"
    >
      <div class="tooltip-arrow"></div>
      <div class="max-h-200px overflow-y-auto file-list">
        <div
          v-for="(file, index) in fileList"
          :key="index"
          class="flex items-center justify-between p-2 mb-1 bg-gray-50 rounded-6px text-12px transition-all-200ms last:mb-0 hover:bg-gray-100"
          :class="{ 'opacity-70': file.uploading }"
        >
          <div class="flex items-center flex-1 min-w-0">
            <Icon :icon="getFileIcon(file.name)" class="text-blue-500 mr-2 flex-shrink-0" />
            <span
              class="font-medium text-gray-900 mr-1 overflow-hidden text-ellipsis whitespace-nowrap flex-1"
              >{{ file.name }}</span
            >
            <span class="text-gray-500 flex-shrink-0 text-11px"
              >({{ formatFileSize(file.size) }})</span
            >
          </div>
          <div class="flex items-center gap-1 flex-shrink-0 ml-2">
            <el-progress
              v-if="file.uploading"
              :percentage="file.progress || 0"
              :show-text="false"
              size="small"
              class="w-60px"
            />
            <el-button
              v-else-if="!disabled"
              link
              type="danger"
              size="small"
              @click="removeFile(index)"
            >
              <Icon icon="ep:close" :size="12" />
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUpload } from '@/components/UploadFile/src/useUpload'
import { formatFileSize, getFileIcon } from '@/utils/file'

export interface FileItem {
  name: string
  size: number
  url?: string
  uploading?: boolean
  progress?: number
  raw?: File
}

defineOptions({ name: 'MessageFileUpload' })

const props = defineProps({
  modelValue: {
    type: Array as PropType<string[]>,
    default: () => []
  },
  limit: {
    type: Number,
    default: 5
  },
  maxSize: {
    type: Number,
    default: 10 // MB
  },
  acceptTypes: {
    type: String,
    default: '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv,.md'
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'upload-success', 'upload-error'])

const fileInputRef = ref<HTMLInputElement>()
const fileList = ref<FileItem[]>([]) // 内部管理文件列表
const uploadedUrls = ref<string[]>([]) // 已上传的 URL 列表
const showTooltip = ref(false) // 控制 tooltip 显示
const hideTimer = ref<NodeJS.Timeout | null>(null) // 隐藏延迟定时器
const message = useMessage()
const { httpRequest } = useUpload()

/** 监听 v-model 变化 */
watch(
  () => props.modelValue,
  (newVal) => {
    uploadedUrls.value = [...newVal]
    // 如果外部清空了 URLs，也清空内部文件列表
    if (newVal.length === 0) {
      fileList.value = []
    }
  },
  { immediate: true, deep: true }
)

/** 触发文件选择 */
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

/** 显示 tooltip */
const showTooltipHandler = () => {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
    hideTimer.value = null
  }
  showTooltip.value = true
}

/** 隐藏 tooltip */
const hideTooltipHandler = () => {
  hideTimer.value = setTimeout(() => {
    showTooltip.value = false
    hideTimer.value = null
  }, 300) // 300ms 延迟隐藏
}

/** 处理文件选择 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])
  if (files.length === 0) {
    return
  }
  // 检查总文件数是否超过限制
  if (files.length + fileList.value.length > props.limit) {
    message.error(`最多只能上传 ${props.limit} 个文件`)
    target.value = '' // 清空输入
    return
  }
  // 处理每个文件
  files.forEach((file) => {
    if (file.size > props.maxSize * 1024 * 1024) {
      message.error(`文件 ${file.name} 大小超过 ${props.maxSize}MB`)
      return
    }
    const fileItem: FileItem = {
      name: file.name,
      size: file.size,
      uploading: true,
      progress: 0,
      raw: file
    }
    fileList.value.push(fileItem)
    // 立即开始上传
    uploadFile(fileItem)
  })

  // 清空 input 值，允许重复选择相同文件
  target.value = ''
}

/** 上传文件 */
const uploadFile = async (fileItem: FileItem) => {
  try {
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (fileItem.progress! < 90) {
        fileItem.progress = (fileItem.progress || 0) + Math.random() * 10
      }
    }, 100)

    // 调用上传接口
    // const formData = new FormData()
    // formData.append('file', fileItem.raw!)
    const response = await httpRequest({
      file: fileItem.raw!,
      filename: fileItem.name
    } as any)
    fileItem.uploading = false
    fileItem.progress = 100
    fileItem.url = (response as any).data
    // 添加到 URL 列表
    uploadedUrls.value.push(fileItem.url!)

    clearInterval(progressInterval)

    emit('upload-success', fileItem)
    updateModelValue()
  } catch (error) {
    fileItem.uploading = false
    message.error(`文件 ${fileItem.name} 上传失败`)
    emit('upload-error', error)

    // 移除上传失败的文件
    const index = fileList.value.indexOf(fileItem)
    if (index > -1) {
      removeFile(index)
    }
  }
}

/** 删除文件 */
const removeFile = (index: number) => {
  // 从 URL 列表中移除
  const removedFile = fileList.value[index]
  fileList.value.splice(index, 1)
  if (removedFile.url) {
    const urlIndex = uploadedUrls.value.indexOf(removedFile.url)
    if (urlIndex > -1) {
      uploadedUrls.value.splice(urlIndex, 1)
    }
  }

  updateModelValue()
}

/** 更新 v-model */
const updateModelValue = () => {
  emit('update:modelValue', [...uploadedUrls.value])
}

// 暴露方法
defineExpose({
  triggerFileInput,
  clearFiles: () => {
    fileList.value = []
    uploadedUrls.value = []
    updateModelValue()
  }
})

// 组件销毁时清理定时器
onUnmounted(() => {
  if (hideTimer.value) {
    clearTimeout(hideTimer.value)
  }
})
</script>

<style scoped>
/* 上传按钮样式 */
.upload-btn {
  --el-button-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-hover-bg-color: var(--el-fill-color-light);
  --el-button-hover-border-color: transparent;
  color: var(--el-text-color-regular);
}

.upload-btn.has-files {
  color: var(--el-color-primary);
  --el-button-hover-bg-color: var(--el-color-primary-light-9);
}

.file-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 240px;
  max-width: 320px;
  padding: 8px;
  animation: fadeInDown 0.2s ease;
}

.tooltip-arrow {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--el-border-color-light);
}

/* Tooltip 箭头伪元素 */
.tooltip-arrow::after {
  content: '';
  position: absolute;
  bottom: 1px;
  left: -4px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid white;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 滚动条样式 */
.file-list::-webkit-scrollbar {
  width: 4px;
}

.file-list::-webkit-scrollbar-track {
  background: transparent;
}

.file-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-light);
  border-radius: 2px;
}

.file-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color);
}
/* 滚动条样式 */
.file-list::-webkit-scrollbar {
  width: 4px;
}

.file-list::-webkit-scrollbar-track {
  background: transparent;
}

.file-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-light);
  border-radius: 2px;
}

.file-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color);
}
</style>
