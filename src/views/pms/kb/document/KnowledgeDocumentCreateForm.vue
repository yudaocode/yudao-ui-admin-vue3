<template>
  <Dialog v-model="dialogVisible" title="新建文档" width="520px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="文档名称" prop="title">
        <el-input v-model="formData.title" maxlength="255" placeholder="请输入文档名称" />
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
import { PmsKnowledgeDocumentType, PmsKnowledgeRootId } from '@/views/pms/kb/utils/constants'

defineOptions({ name: 'PmsKnowledgeDocumentCreateForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const formLoading = ref(false) // 表单提交中
const formData = ref(getDefaultFormData()) // 表单数据
const formRules = reactive({
  title: [{ required: true, message: '请输入文档名称', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
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

/** 提交表单 */
async function submitForm() {
  // 1. 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 2. 创建文档
  formLoading.value = true
  try {
    await KnowledgeDocumentApi.createKnowledgeDocument(formData.value)
    message.success('创建成功')
    // 3. 关闭弹窗并通知父组件刷新
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 获得表单默认数据 */
function getDefaultFormData() {
  return {
    libraryId: 0,
    folderId: PmsKnowledgeRootId,
    parentId: PmsKnowledgeRootId,
    title: '',
    type: PmsKnowledgeDocumentType.RICH_TEXT as number
  }
}
</script>
