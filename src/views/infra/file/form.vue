<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-upload
      ref="uploadRef"
      :limit="1"
      accept=".jpg, .png, .gif"
      :auto-upload="false"
      drag
      :headers="headers"
      :action="url"
      :data="data"
      :disabled="formLoading"
      :on-change="handleFileChange"
      :on-progress="handleFileUploadProgress"
      :on-success="handleFileSuccess"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text"> 将文件拖到此处，或 <em>点击上传</em> </div>
      <template #tip>
        <div class="el-upload__tip" style="color: red">
          提示：仅允许导入 jpg、png、gif 格式文件！
        </div>
      </template>
    </el-upload>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="submitFileForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { Dialog } from '@/components/Dialog'
import { getAccessToken } from '@/utils/auth'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const url = import.meta.env.VITE_UPLOAD_URL
const headers = { Authorization: 'Bearer ' + getAccessToken() }
const data = ref({ path: '' })
const uploadRef = ref()

/** 打开弹窗 */
const openModal = async () => {
  modelVisible.value = true
  modelTitle.value = t('action.fileUpload')
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
/** 处理上传的文件发生变化 */
const handleFileChange = (file) => {
  data.value.path = file.name
}

/** 处理文件上传中 */
const handleFileUploadProgress = () => {
  formLoading.value = true // 禁止修改
}

/** 发起文件上传 */
const submitFileForm = () => {
  unref(uploadRef)?.submit()
}

/** 文件上传成功处理 */
const handleFileSuccess = () => {
  // 清理
  modelVisible.value = false
  formLoading.value = false
  unref(uploadRef)?.clearFiles()
  // 提示成功，并刷新
  message.success(t('common.createSuccess'))
  emit('success')
}
</script>
