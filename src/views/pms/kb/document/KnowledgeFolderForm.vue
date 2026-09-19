<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="文件夹名称" prop="title">
        <el-input v-model="formData.title" maxlength="255" placeholder="请输入文件夹名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as KnowledgeFolderApi from '@/api/pms/kb/content/folder'
import { PmsKnowledgeRootId } from '@/views/pms/kb/utils/constants'

defineOptions({ name: 'PmsKnowledgeFolderForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单提交中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref(getDefaultFormData()) // 表单数据
const formRules = reactive({
  title: [{ required: true, message: '请输入文件夹名称', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open(type: string, libraryId: number, parentId = 0, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新建文件夹' : '编辑文件夹'
  formType.value = type
  resetForm()
  formData.value.libraryId = libraryId
  formData.value.parentId = parentId
  if (id) {
    formLoading.value = true
    try {
      const folder = await KnowledgeFolderApi.getKnowledgeFolder(id)
      formData.value = {
        id: folder.id,
        libraryId: folder.libraryId,
        parentId: folder.parentId,
        title: folder.title
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await KnowledgeFolderApi.createKnowledgeFolder(
        formData.value as KnowledgeFolderApi.PmsKnowledgeFolderVO
      )
      message.success('创建成功')
    } else {
      await KnowledgeFolderApi.updateKnowledgeFolder(
        formData.value as KnowledgeFolderApi.PmsKnowledgeFolderVO
      )
      message.success('更新成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
function resetForm() {
  formData.value = getDefaultFormData()
  formRef.value?.resetFields()
}

/** 获得默认表单数据 */
function getDefaultFormData() {
  return {
    id: undefined as number | undefined,
    libraryId: 0,
    parentId: PmsKnowledgeRootId,
    title: ''
  }
}
</script>
