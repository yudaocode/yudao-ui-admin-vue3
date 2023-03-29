<template>
  <Dialog
    :title="upload.title"
    :modelValue="showDialog"
    width="400px"
    append-to-body
    @close="closeDialog"
  >
    <el-upload
      ref="uploadRef"
      accept=".xlsx, .xls"
      :limit="1"
      :headers="upload.headers"
      :action="upload.url + '?updateSupport=' + upload.updateSupport"
      :disabled="upload.isUploading"
      :on-progress="handleFileUploadProgress"
      :on-success="handleFileSuccess"
      :on-exceed="handleExceed"
      :on-error="excelUploadError"
      :auto-upload="false"
      drag
    >
      <Icon icon="ep:upload" />
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip text-center">
          <div class="el-upload__tip">
            <el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的用户数据
          </div>

          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link
            type="primary"
            :underline="false"
            style="font-size: 12px; vertical-align: baseline"
            @click="importTemplate"
            >下载模板</el-link
          >
        </div>
      </template>
    </el-upload>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { importUserTemplateApi } from '@/api/system/user'
import { getAccessToken, getTenantId } from '@/utils/auth'
import download from '@/utils/download'

const emits = defineEmits(['success'])

const message = useMessage() // 消息弹窗

const showDialog = ref(false)
const uploadRef = ref()

// 用户导入参数
const upload = reactive({
  // // 是否显示弹出层（用户导入）
  // open: false,
  // 弹出层标题（用户导入）
  title: '用户导入',
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: {
    Authorization: 'Bearer ' + getAccessToken(),
    'tenant-id': getTenantId()
  },
  // 上传的地址
  url: import.meta.env.VITE_BASE_URL + import.meta.env.VITE_API_URL + '/system/user/import'
})

// 文件上传中处理
const handleFileUploadProgress = () => {
  upload.isUploading = true
}
// 文件上传成功处理
const handleFileSuccess = (response: any) => {
  if (response.code !== 0) {
    message.error(response.msg)
    return
  }
  upload.isUploading = false
  uploadRef.value?.clearFiles()
  // 拼接提示语
  const data = response.data
  let text = '上传成功数量：' + data.createUsernames.length + ';'
  for (let username of data.createUsernames) {
    text += '< ' + username + ' >'
  }
  text += '更新成功数量：' + data.updateUsernames.length + ';'
  for (const username of data.updateUsernames) {
    text += '< ' + username + ' >'
  }
  text += '更新失败数量：' + Object.keys(data.failureUsernames).length + ';'
  for (const username in data.failureUsernames) {
    text += '< ' + username + ': ' + data.failureUsernames[username] + ' >'
  }
  message.alert(text)
  emits('success')
  closeDialog()
}

// 文件数超出提示
const handleExceed = (): void => {
  message.error('最多只能上传一个文件！')
}
// 上传错误提示
const excelUploadError = (e): void => {
  console.log(e)
  message.error('导入数据失败，请您重新上传！')
}

/** 下载模板操作 */
const importTemplate = async () => {
  try {
    const res = await importUserTemplateApi()
    download.excel(res, '用户导入模版.xls')
  } catch (error) {
    console.error(error)
  }
}

/* 弹框按钮操作 */
// 点击取消
const cancel = () => {
  closeDialog()
}
// 关闭弹窗
const closeDialog = () => {
  showDialog.value = false
}
// 提交上传文件
const submitFileForm = () => {
  uploadRef.value?.submit()
}

const openForm = () => {
  uploadRef.value?.clearFiles()
  showDialog.value = true
}
defineExpose({
  openForm
})
</script>
