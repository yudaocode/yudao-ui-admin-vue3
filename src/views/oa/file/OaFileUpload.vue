<template>
  <!-- 上传文件并登记云盘节点 -->
  <el-upload :show-file-list="false" :http-request="handleUpload" :disabled="uploadLoading">
    <el-button type="primary" :loading="uploadLoading">
      <Icon icon="ep:upload" /> 上传文件
    </el-button>
  </el-upload>
</template>

<script setup lang="ts">
import type { UploadRequestOptions } from 'element-plus'
import * as NodeApi from '@/api/oa/file/node'
import * as FileApi from '@/api/infra/file'
import { OA_FILE_NODE_TYPE } from '@/views/oa/utils/constants'

defineOptions({ name: 'OaFileUpload' })

const props = defineProps<{ parentId: number }>() // 上传目标目录
const emit = defineEmits(['success']) // 定义 success 事件，用于上传成功后的回调
const message = useMessage() // 消息弹窗

const uploadLoading = ref(false) // 文件上传中

/** 上传文件 */
async function handleUpload(options: UploadRequestOptions) {
  // 保存上传开始时的目标目录，避免切换目录后登记到其他位置
  const parentId = props.parentId
  uploadLoading.value = true
  try {
    // 上传文件，获得平台文件地址
    const result = await FileApi.updateFile({
      file: options.file,
      directory: 'oa/file'
    })
    if (result.code !== 0) {
      throw new Error('上传失败')
    }
    // 登记云盘节点，分类由后端根据文件扩展名计算
    await NodeApi.createFileNode({
      parentId,
      type: OA_FILE_NODE_TYPE.FILE,
      name: options.file.name,
      url: result.data,
      size: options.file.size
    })
    message.success('上传成功')
    emit('success')
  } finally {
    uploadLoading.value = false
  }
}
</script>
