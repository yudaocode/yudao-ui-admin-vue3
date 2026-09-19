<template>
  <div
    class="min-h-360px flex items-center justify-center overflow-hidden border border-solid border-[var(--el-border-color-lighter)] rounded-[var(--el-border-radius-base)] bg-[var(--el-fill-color-lighter)]"
  >
    <el-image
      v-if="previewType === 'image'"
      class="h-520px w-full"
      fit="contain"
      :preview-src-list="[url]"
      :src="url"
    />
    <iframe
      v-else-if="previewType === 'iframe'"
      class="h-620px w-full border-0 bg-[var(--el-bg-color)]"
      :src="url"
      title="文件在线预览"
    ></iframe>
    <video v-else-if="previewType === 'video'" class="h-520px w-full" controls :src="url">
      当前浏览器不支持视频预览
    </video>
    <audio v-else-if="previewType === 'audio'" class="w-[min(560px,90%)]" controls :src="url">
      当前浏览器不支持音频预览
    </audio>
    <el-alert v-else :closable="false" show-icon :title="unsupportedTitle" type="info" />
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'FilePreview' })

const props = defineProps<{
  url: string
  fileName?: string
  fileType?: string
  downloadable?: boolean
}>()

const IMAGE_EXTENSIONS = new Set(['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'])
const IFRAME_EXTENSIONS = new Set(['pdf', 'txt'])
const VIDEO_EXTENSIONS = new Set(['m4v', 'mov', 'mp4', 'ogg', 'webm'])
const AUDIO_EXTENSIONS = new Set(['aac', 'flac', 'm4a', 'mp3', 'wav'])

const declaredType = computed(() => props.fileType?.trim().toLowerCase().replace(/^\./, '') || '')
const extension = computed(() => {
  if (declaredType.value && !declaredType.value.includes('/')) return declaredType.value
  const path = (props.fileName || props.url).split(/[?#]/)[0]
  const index = path.lastIndexOf('.')
  return index >= 0 ? path.slice(index + 1).toLowerCase() : ''
})
const previewType = computed(() => {
  if (declaredType.value.startsWith('image/')) return 'image'
  if (declaredType.value === 'application/pdf' || declaredType.value === 'text/plain')
    return 'iframe'
  if (declaredType.value.startsWith('video/')) return 'video'
  if (declaredType.value.startsWith('audio/')) return 'audio'
  if (IMAGE_EXTENSIONS.has(extension.value)) return 'image'
  if (IFRAME_EXTENSIONS.has(extension.value)) return 'iframe'
  if (VIDEO_EXTENSIONS.has(extension.value)) return 'video'
  if (AUDIO_EXTENSIONS.has(extension.value)) return 'audio'
  return 'unsupported'
})
const unsupportedTitle = computed(() =>
  props.downloadable
    ? '当前文件格式暂不支持在线预览，可使用下载功能查看'
    : '当前文件格式暂不支持在线预览，且当前账号没有下载权限'
)
</script>
