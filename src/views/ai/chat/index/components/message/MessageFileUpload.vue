<template>
  <div
    class="message-file-upload"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <!-- 文件上传按钮 -->
    <el-button
      v-if="!disabled"
      circle
      size="small"
      class="upload-btn"
      :class="{ 'has-files': fileList.length > 0 }"
      @click="triggerFileInput"
      :disabled="fileList.length >= limit"
    >
      <Icon icon="ep:paperclip" :size="16" />
      <!-- 文件数量徽章 -->
      <span v-if="fileList.length > 0" class="file-badge">{{ fileList.length }}</span>
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
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
    >
      <div class="tooltip-arrow"></div>
      <div class="file-list">
        <div
          v-for="(file, index) in fileList"
          :key="index"
          class="file-item"
          :class="{ uploading: file.uploading }"
        >
          <div class="file-info">
            <Icon :icon="getFileIcon(file.name)" class="file-icon" />
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">({{ formatFileSize(file.size) }})</span>
          </div>
          <div class="file-actions">
            <el-progress
              v-if="file.uploading"
              :percentage="file.progress || 0"
              :show-text="false"
              size="small"
              class="progress-bar"
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
</script>

<style scoped>
.message-file-upload {
  position: relative;
  display: inline-block;
}

.upload-btn {
  --el-button-bg-color: transparent;
  --el-button-border-color: transparent;
  --el-button-hover-bg-color: var(--el-fill-color-light);
  --el-button-hover-border-color: transparent;
  color: var(--el-text-color-regular);
  position: relative;
  transition: all 0.2s ease;
}

.upload-btn.has-files {
  color: var(--el-color-primary);
  --el-button-hover-bg-color: var(--el-color-primary-light-9);
}

.file-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--el-color-danger);
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 8px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-weight: 500;
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

.file-list {
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  margin-bottom: 4px;
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
  font-size: 12px;
  transition: all 0.2s;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-item:hover {
  background: var(--el-fill-color-light);
}

.file-item.uploading {
  opacity: 0.7;
}

.file-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.file-icon {
  color: var(--el-color-primary);
  margin-right: 8px;
  flex-shrink: 0;
}

.file-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-right: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.file-size {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  font-size: 11px;
}

.file-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 8px;
}

.progress-bar {
  width: 60px;
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
