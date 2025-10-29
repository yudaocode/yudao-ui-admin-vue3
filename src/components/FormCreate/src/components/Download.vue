<template>
  <el-button
    v-bind="buttonAttrs"
    :type="buttonType"
    :icon="showIcon ? Download : undefined"
    :loading="loading"
    :disabled="disabled || !fileUrl"
    @click="handleDownload"
  >
    {{ buttonText }}
  </el-button>
</template>

<script lang="ts" setup>
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

defineOptions({ name: 'FcDownload' })

interface Props {
  modelValue?: string | string[] // FormCreate 会传递这个属性，但我们不使用
  fileUrl?: string // 文件下载地址
  fileName?: string // 文件名称（可选，如果不提供则从 URL 中提取）
  buttonText?: string // 按钮文本
  buttonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text' | 'default' // 按钮类型
  showIcon?: boolean // 是否显示图标
  disabled?: boolean // 是否禁用
  downloadMethod?: 'link' | 'fetch' // 下载方式：link-直接链接下载，fetch-通过接口下载
  formCreateInject?: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  fileUrl: '',
  fileName: '',
  buttonText: '下载文件',
  buttonType: 'primary',
  showIcon: true,
  disabled: false,
  downloadMethod: 'link'
})

const attrs = useAttrs()
const loading = ref(false)

// 过滤掉已经在 props 中定义的属性，剩余的作为按钮属性
const buttonAttrs = computed(() => {
  const { modelValue, fileUrl, fileName, buttonText, buttonType, showIcon, disabled, downloadMethod, formCreateInject, ...rest } = attrs
  return rest
})

// 获取文件名
const getFileName = () => {
  if (props.fileName) {
    return props.fileName
  }
  // 从 URL 中提取文件名
  try {
    const url = new URL(props.fileUrl)
    const pathname = url.pathname
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1)
    return filename || 'download'
  } catch {
    return 'download'
  }
}

// 处理下载
const handleDownload = async () => {
  if (!props.fileUrl) {
    ElMessage.warning('文件地址不能为空')
    return
  }

  loading.value = true
  try {
    if (props.downloadMethod === 'link') {
      // 直接链接下载
      const link = document.createElement('a')
      link.href = props.fileUrl
      link.download = getFileName()
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      ElMessage.success('开始下载')
    } else {
      // 通过 fetch 下载
      const response = await fetch(props.fileUrl)
      if (!response.ok) {
        throw new Error('下载失败')
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = getFileName()
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      ElMessage.success('下载成功')
    }
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请检查文件地址')
  } finally {
    loading.value = false
  }
}
</script>


