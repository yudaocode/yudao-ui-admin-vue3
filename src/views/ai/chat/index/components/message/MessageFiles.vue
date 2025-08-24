<template>
  <div v-if="attachmentUrls && attachmentUrls.length > 0" class="mt-2">
    <div class="flex flex-wrap gap-2">
      <div
        v-for="(url, index) in attachmentUrls"
        :key="index"
        class="flex items-center p-3 bg-gray-1 rounded-2 cursor-pointer transition-all duration-200 min-w-40 max-w-70 border border-transparent hover:(bg-gray-2 -translate-y-1 shadow-lg)"
        @click="handleFileClick(url)"
      >
        <div class="mr-3 flex-shrink-0">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-1.5 text-white font-bold"
            :class="getFileTypeClass(getFileNameFromUrl(url))"
          >
            <Icon :icon="getFileIcon(getFileNameFromUrl(url))" :size="20" />
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div
            class="text-sm font-medium text-gray-8 leading-tight mb-1 overflow-hidden text-ellipsis whitespace-nowrap"
            :title="getFileNameFromUrl(url)"
          >
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
    return 'bg-gradient-to-br from-yellow-4 to-orange-5'
  } else if (['pdf'].includes(ext)) {
    return 'bg-gradient-to-br from-red-5 to-red-7'
  } else if (['doc', 'docx'].includes(ext)) {
    return 'bg-gradient-to-br from-blue-6 to-blue-8'
  } else if (['xls', 'xlsx'].includes(ext)) {
    return 'bg-gradient-to-br from-green-6 to-green-8'
  } else if (['ppt', 'pptx'].includes(ext)) {
    return 'bg-gradient-to-br from-orange-6 to-orange-8'
  } else if (['mp3', 'wav', 'm4a', 'aac'].includes(ext)) {
    return 'bg-gradient-to-br from-purple-5 to-purple-7'
  } else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
    return 'bg-gradient-to-br from-red-5 to-red-7'
  } else {
    return 'bg-gradient-to-br from-gray-5 to-gray-7'
  }
}

/** 点击文件 */
const handleFileClick = (url: string) => {
  window.open(url, '_blank')
}
</script>
