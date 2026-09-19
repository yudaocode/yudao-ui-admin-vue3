<template>
  <Dialog v-model="dialogVisible" title="上传文件" width="560px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="文件" prop="content">
        <UploadFile
          v-model="formData.content"
          :file-size="PmsKnowledgeUploadFileSize"
          :file-type="allowedFileTypes"
          :is-show-tip="true"
          :limit="1"
          @update:model-value="handleFileChange"
          @update:file-size="handleFileSizeChange"
        />
      </el-form-item>
      <el-form-item label="文件名称" prop="title">
        <el-input v-model="formData.title" maxlength="255" placeholder="上传后自动填充，可修改" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentApi from '@/api/pms/kb/content/document'
import {
  PmsKnowledgeDocumentType,
  PmsKnowledgeRootId,
  PmsKnowledgeUploadFileSize,
  PmsKnowledgeUploadFileTypes
} from '@/views/pms/kb/utils/constants'

defineOptions({ name: 'PmsKnowledgeFileUploadForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 表单提交中
const formRef = ref() // 表单 Ref
const formData = ref(getDefaultFormData()) // 表单数据
const allowedFileTypes = [...PmsKnowledgeUploadFileTypes] // 允许上传的文件类型
const formRules = reactive({
  title: [{ required: true, message: '请输入文件名称', trigger: 'blur' }],
  content: [{ required: true, message: '请上传文件', trigger: 'change' }]
}) // 表单校验规则
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开上传弹窗，并将文件归入当前目录 */
function open(libraryId: number, folderId = PmsKnowledgeRootId, parentId = PmsKnowledgeRootId) {
  dialogVisible.value = true
  formData.value = {
    ...getDefaultFormData(),
    libraryId,
    folderId,
    parentId
  }
  formRef.value?.resetFields()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 文件上传完成后，用文件地址填充名称和扩展名 */
function handleFileChange(value: string) {
  if (!value) return
  const fileName = decodeURIComponent(value.split('?')[0].split('/').pop() || '')
  formData.value.fileType = fileName.includes('.')
    ? fileName.split('.').pop()?.toLowerCase()
    : undefined
  if (!formData.value.title) {
    formData.value.title = fileName.replace(/\.[^.]+$/, '') || fileName
  }
  formRef.value?.clearValidate(['content', 'title'])
}

/** 文件上传完成后保存文件大小元数据 */
function handleFileSizeChange(value?: number) {
  formData.value.fileSize = value
}

/** 提交文件类型文档 */
async function submitForm() {
  // 1. 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 2. 创建文件类型文档
  formLoading.value = true
  try {
    await KnowledgeDocumentApi.createKnowledgeDocument(formData.value)
    message.success('上传成功')
    // 3. 关闭弹窗并通知父组件刷新
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 获得文件文档上传表单默认数据 */
function getDefaultFormData() {
  return {
    libraryId: 0,
    folderId: PmsKnowledgeRootId,
    parentId: PmsKnowledgeRootId,
    title: '',
    type: PmsKnowledgeDocumentType.FILE as number,
    content: '',
    fileType: undefined as string | undefined,
    fileSize: undefined as number | undefined
  }
}
</script>
