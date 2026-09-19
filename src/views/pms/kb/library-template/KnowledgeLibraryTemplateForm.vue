<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px" @closed="handleClosed">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="96px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="模板名称" prop="name">
            <el-input
              v-model="formData.name"
              maxlength="100"
              placeholder="请输入模板名称"
              show-word-limit
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模板状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="显示顺序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" class="!w-100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="模板封面" prop="coverUrl">
            <UploadImg v-model="formData.coverUrl" :limit="1" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="模板简介" prop="description">
        <el-input
          v-model="formData.description"
          :rows="3"
          maxlength="500"
          placeholder="请输入模板适用场景"
          show-word-limit
          type="textarea"
        />
      </el-form-item>
      <el-form-item label="模板文档" prop="documents">
        <div class="w-full">
          <el-table :data="formData.documents" border row-key="title">
            <el-table-column align="center" label="#" type="index" width="60" />
            <el-table-column label="文档标题" min-width="300" prop="title" />
            <el-table-column align="center" label="操作" width="160">
              <template #default="scope">
                <el-button link type="primary" @click="openDocumentForm(scope.$index)">
                  编辑
                </el-button>
                <el-button link type="danger" @click="removeDocument(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button class="mt-12px" plain type="primary" @click="openDocumentForm()">
            <Icon icon="ep:plus" />新增文档
          </el-button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <!-- 模板文档编辑 -->
  <Dialog v-model="documentDialogVisible" title="编辑模板文档" width="900px">
    <el-form
      ref="documentFormRef"
      :model="documentFormData"
      :rules="documentFormRules"
      label-width="80px"
    >
      <el-form-item label="文档标题" prop="title">
        <el-input
          v-model="documentFormData.title"
          maxlength="255"
          placeholder="请输入文档标题"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="文档内容" prop="content">
        <Editor v-model="documentFormData.content" height="420px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="submitDocumentForm">确 定</el-button>
      <el-button @click="documentDialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as KnowledgeLibraryTemplateApi from '@/api/pms/kb/library/template'

defineOptions({ name: 'PmsKnowledgeLibraryTemplateForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData =
  ref<KnowledgeLibraryTemplateApi.PmsKnowledgeLibraryTemplateSaveReqVO>(getDefaultFormData())
const formRef = ref<FormInstance>() // 表单 Ref
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择模板状态', trigger: 'change' }],
  sort: [{ required: true, message: '请输入显示顺序', trigger: 'blur' }],
  documents: [{ required: true, message: '请至少添加一篇模板文档', trigger: 'change' }]
}) // 表单校验规则
const documentDialogVisible = ref(false) // 文档编辑弹窗是否显示
const documentFormRef = ref<FormInstance>() // 文档表单 Ref
const documentFormData = ref<KnowledgeLibraryTemplateApi.PmsKnowledgeLibraryTemplateDocumentVO>({
  title: '',
  content: ''
})
const documentFormRules = reactive<FormRules>({
  title: [{ required: true, message: '请输入文档标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文档内容', trigger: 'change' }]
}) // 文档表单校验规则
const editingDocumentIndex = ref(-1) // 当前编辑文档下标
const emit = defineEmits<{ success: [] }>() // 操作成功事件

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  formType.value = type
  dialogTitle.value = type === 'create' ? '新增知识库模板' : '修改知识库模板'
  resetForm()
  // 修改时，设置数据
  if (type === 'update' && id) {
    formLoading.value = true
    try {
      const data = await KnowledgeLibraryTemplateApi.getKnowledgeLibraryTemplate(id)
      formData.value = data
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 新增或编辑模板文档 */
function openDocumentForm(index = -1) {
  editingDocumentIndex.value = index
  documentFormData.value =
    index >= 0 ? { ...formData.value.documents[index] } : { title: '', content: '<p></p>' }
  documentFormRef.value?.clearValidate()
  documentDialogVisible.value = true
}

/** 保存模板文档 */
async function submitDocumentForm() {
  if (!documentFormRef.value || !(await documentFormRef.value.validate())) return
  const document = { ...documentFormData.value }
  if (editingDocumentIndex.value < 0) {
    formData.value.documents.push(document)
  } else {
    formData.value.documents[editingDocumentIndex.value] = document
  }
  documentDialogVisible.value = false
}

/** 删除模板文档 */
async function removeDocument(index: number) {
  try {
    // 删除的二次确认
    await message.confirm('确定删除该模板文档吗？')
    formData.value.documents.splice(index, 1)
  } catch {}
}

/** 提交表单 */
async function submitForm() {
  // 校验表单
  if (!formRef.value || !(await formRef.value.validate())) return
  const documentTitles = formData.value.documents.map((document) => document.title)
  if (new Set(documentTitles).size !== documentTitles.length) {
    message.warning('模板文档标题不能重复')
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await KnowledgeLibraryTemplateApi.createKnowledgeLibraryTemplate(formData.value)
      message.success('新增成功')
    } else {
      await KnowledgeLibraryTemplateApi.updateKnowledgeLibraryTemplate(formData.value)
      message.success('修改成功')
    }
    dialogVisible.value = false
    // 发送操作成功的事件
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

/** 弹窗关闭时清理表单状态 */
function handleClosed() {
  documentDialogVisible.value = false
  formRef.value?.resetFields()
}

/** 获得默认表单数据 */
function getDefaultFormData(): KnowledgeLibraryTemplateApi.PmsKnowledgeLibraryTemplateSaveReqVO {
  return {
    id: undefined,
    name: '',
    description: '',
    coverUrl: undefined,
    status: CommonStatusEnum.ENABLE,
    sort: 0,
    documents: []
  }
}
</script>
