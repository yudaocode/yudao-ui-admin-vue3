<template>
  <Dialog v-model="dialogVisible" :title="fileName" width="900px">
    <!-- 获得后端授权地址后预览，关闭弹窗时卸载媒体内容 -->
    <div v-loading="loading" class="min-h-360px">
      <FilePreview
        v-if="dialogVisible && fileUrl"
        :url="fileUrl"
        :file-name="fileName"
        :file-type="fileType"
        :downloadable="true"
      />
    </div>
    <template #footer>
      <el-button :disabled="loading || !fileUrl" type="primary" @click="handleDownload">
        下 载
      </el-button>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { FilePreview } from '@/components/FilePreview'
import * as NodeApi from '@/api/oa/file/node'
import { OA_FILE_PERMISSION_LEVEL } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaFilePreview' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 文件地址加载中
const fileId = ref<number>() // 文件编号
const fileName = ref('') // 文件名称
const fileType = ref('') // 文件扩展名
const fileUrl = ref('') // 后端授权的临时文件地址

/** 打开文件预览 */
async function open(row: NodeApi.OaFileNodeVO) {
  // 预览沿用下载权限，不能通过列表中的原始地址绕过后端校验
  if ((row.level || 0) < OA_FILE_PERMISSION_LEVEL.DOWNLOAD) {
    message.warning('当前仅具有查看文件信息的权限')
    return
  }
  dialogVisible.value = true
  fileId.value = row.id
  fileName.value = row.name
  fileType.value = row.extension || ''
  fileUrl.value = ''
  loading.value = true
  try {
    const data = await NodeApi.getFileNode(row.id!)
    if (!data.url) {
      message.warning('当前文件不可预览或下载')
      dialogVisible.value = false
      return
    }
    fileName.value = data.name
    fileType.value = data.extension || ''
    fileUrl.value = data.url
  } catch {
    // 请求失败由公共请求拦截器提示，关闭未能加载的预览弹窗
    dialogVisible.value = false
  } finally {
    loading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 下载当前文件 */
async function handleDownload() {
  // 下载时重新查询详情，避免沿用已过期的临时地址或已撤销的共享权限
  const data = await NodeApi.getFileNode(fileId.value!)
  if (!data.url) {
    message.warning('当前文件不可下载')
    return
  }
  window.open(data.url, '_blank', 'noopener,noreferrer')
}
</script>
