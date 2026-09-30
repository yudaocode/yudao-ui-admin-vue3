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
    <div v-else-if="previewType === 'text'" v-loading="textLoading" class="min-h-360px w-full">
      <el-alert v-if="textError" :closable="false" show-icon :title="textError" type="error" />
      <pre v-else class="m-0 max-h-620px overflow-auto whitespace-pre-wrap break-words p-16px">
        {{ textContent }}
      </pre>
    </div>
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
const IFRAME_EXTENSIONS = new Set(['pdf'])
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
  if (declaredType.value === 'text/plain') return 'text'
  if (declaredType.value === 'application/pdf') return 'iframe'
  if (declaredType.value.startsWith('video/')) return 'video'
  if (declaredType.value.startsWith('audio/')) return 'audio'
  if (IMAGE_EXTENSIONS.has(extension.value)) return 'image'
  if (extension.value === 'txt') return 'text'
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

const textLoading = ref(false) // 纯文本加载中
const textContent = ref('') // 纯文本内容，不作为 HTML 执行
const textError = ref('') // 文本加载失败提示

/** 加载纯文本，未声明编码时使用 UTF-8，避免浏览器自动猜测导致中文乱码 */
watch(
  [() => props.url, previewType],
  async ([url, type], _oldValue, onCleanup) => {
    textContent.value = ''
    textError.value = ''
    textLoading.value = false
    if (type !== 'text' || !url) return
    // 切换文件或关闭预览时取消旧请求，防止旧内容覆盖当前文件
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    textLoading.value = true
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error('文件请求失败')
      const charset = response.headers.get('content-type')?.match(/charset=["']?([^;"'\s]+)/i)?.[1]
      const content = new TextDecoder(charset || 'utf-8').decode(await response.arrayBuffer())
      if (!controller.signal.aborted) textContent.value = content
    } catch {
      if (!controller.signal.aborted) textError.value = '文件预览失败，请下载后查看'
    } finally {
      if (!controller.signal.aborted) textLoading.value = false
    }
  },
  { immediate: true }
)
</script>
