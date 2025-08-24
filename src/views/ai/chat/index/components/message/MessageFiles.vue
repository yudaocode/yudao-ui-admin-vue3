<template>
  <div v-if="attachmentUrls && attachmentUrls.length > 0" class="message-files">
    <div class="files-container">
      <div
        v-for="(url, index) in attachmentUrls"
        :key="index"
        class="file-card"
        @click="handleFileClick(url)"
      >
        <div class="file-icon-wrapper">
          <div class="file-icon" :class="getFileTypeClass(getFileNameFromUrl(url))">
            <Icon :icon="getFileIcon(getFileNameFromUrl(url))" :size="20" />
          </div>
        </div>
        <div class="file-content">
          <div class="file-name" :title="getFileNameFromUrl(url)">
            {{ getFileNameFromUrl(url) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFileIcon, getFileNameFromUrl, isImage } from '@/utils/file'

defineOptions({ name: 'MessageFiles' })

defineProps<{
  attachmentUrls?: string[]
}>()

/** 获取文件类型样式类 */
const getFileTypeClass = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (isImage(ext)) {
    return 'file-image'
  } else if (['pdf'].includes(ext)) {
    return 'file-pdf'
  } else if (['doc', 'docx'].includes(ext)) {
    return 'file-word'
  } else if (['xls', 'xlsx'].includes(ext)) {
    return 'file-excel'
  } else if (['ppt', 'pptx'].includes(ext)) {
    return 'file-powerpoint'
  } else if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) {
    return 'file-audio'
  } else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
    return 'file-video'
  } else {
    return 'file-default'
  }
}

/** 点击文件 */
const handleFileClick = (url: string) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
.message-files {
  margin-top: 8px;
}

.files-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-card {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
  max-width: 280px;
  border: 1px solid transparent;
}

.file-card:hover {
  background: #ebebeb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-icon-wrapper {
  margin-right: 12px;
  flex-shrink: 0;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: white;
  font-weight: bold;
}

/* 不同文件类型的图标背景色 */
.file-icon.file-image {
  background: linear-gradient(135deg, #ffd700, #ffa500);
}

.file-icon.file-pdf {
  background: linear-gradient(135deg, #ff4444, #cc1111);
}

.file-icon.file-word {
  background: linear-gradient(135deg, #2b5797, #1e3f66);
}

.file-icon.file-excel {
  background: linear-gradient(135deg, #1d6f42, #0f4728);
}

.file-icon.file-powerpoint {
  background: linear-gradient(135deg, #d24726, #a73319);
}

.file-icon.file-audio {
  background: linear-gradient(135deg, #9c27b0, #6a1b9a);
}

.file-icon.file-video {
  background: linear-gradient(135deg, #f44336, #c62828);
}

.file-icon.file-default {
  background: linear-gradient(135deg, #607d8b, #455a64);
}

.file-content {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.3;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
