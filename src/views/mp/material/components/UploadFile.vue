<template>
  <el-upload
    :action="UPLOAD_URL"
    :headers="HEADERS"
    multiple
    :limit="1"
    :file-list="fileList"
    :data="uploadData"
    :on-progress="() => (uploading = true)"
    :on-error="(err: Error) => message.error(`上传失败: ${err.message}`)"
    :before-upload="beforeUpload"
    :on-success="handleUploadSuccess"
  >
    <el-button type="primary" plain :loading="uploading" :disabled="uploading">
      {{ uploading ? '正在上传' : '点击上传' }}
    </el-button>
    <template #tip>
      <span class="el-upload__tip" style="margin-left: 5px">
        <slot></slot>
      </span>
    </template>
  </el-upload>
</template>
<script setup lang="ts">
import type { UploadProps, UploadUserFile } from 'element-plus'
import {
  HEADERS,
  UPLOAD_URL,
  UploadData,
  MaterialType,
  beforeImageUpload,
  beforeVoiceUpload
} from './upload'

const message = useMessage()

const props = defineProps<{ type: MaterialType }>()

const fileList = ref<UploadUserFile[]>([])
const emit = defineEmits<{
  (e: 'uploaded', v: void)
}>()

const uploadData: UploadData = reactive({
  type: MaterialType.Image,
  title: '',
  introduction: ''
})
const uploading = ref(false)

const beforeUpload = props.type === MaterialType.Image ? beforeImageUpload : beforeVoiceUpload

const handleUploadSuccess: UploadProps['onSuccess'] = (res: any) => {
  if (res.code !== 0) {
    message.alertError('上传出错：' + res.msg)
    return false
  }

  // 清空上传时的各种数据
  fileList.value = []
  uploadData.title = ''
  uploadData.introduction = ''

  message.notifySuccess('上传成功')
  uploading.value = false
  emit('uploaded')
}
</script>
