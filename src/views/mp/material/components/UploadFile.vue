<template>
  <el-upload
    :action="UPLOAD_URL"
    :headers="HEADERS"
    multiple
    :limit="1"
    :file-list="fileList"
    :data="uploadData"
    :on-progress="(isUploading = true)"
    :on-error="onUploadError"
    :before-upload="onBeforeUpload"
    :on-success="onUploadSuccess"
  >
    <el-button type="primary" plain :loading="isUploading" :disabled="isUploading">
      {{ isUploading ? '正在上传' : '点击上传' }}
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
const isUploading = ref(false)

/** 上传前检查 */
const onBeforeUpload = props.type === MaterialType.Image ? beforeImageUpload : beforeVoiceUpload

/** 上传成功处理 */
const onUploadSuccess: UploadProps['onSuccess'] = (res: any) => {
  if (res.code !== 0) {
    message.alertError('上传出错：' + res.msg)
    return false
  }

  // 清空上传时的各种数据
  fileList.value = []
  uploadData.title = ''
  uploadData.introduction = ''

  message.notifySuccess('上传成功')
  isUploading.value = false
  emit('uploaded')
}

/** 上传失败处理 */
const onUploadError = (err: Error) => message.error('上传失败: ' + err.message)
</script>

<style lang="scss" scoped>
.el-upload__tip {
  margin-left: 5px;
}
</style>
