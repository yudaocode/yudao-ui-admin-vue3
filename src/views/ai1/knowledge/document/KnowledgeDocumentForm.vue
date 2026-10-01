<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1000px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="90px"
      v-loading="formLoading"
    >
      <!-- 修改时提示 -->
      <el-alert
        v-if="formType === 'update'"
        class="mb-15px"
        type="warning"
        :closable="false"
        show-icon
        title="修改文档内容后，向量化状态将重置为“未处理”，需要重新向量化才能被检索到"
      />
      <el-form-item label="文档名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入文档名称" maxlength="255" />
      </el-form-item>
      <el-form-item label="文档内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :maxlength="16777215"
          :rows="20"
          :input-style="{ maxHeight: '52vh' }"
          placeholder="请输入文档内容（粘贴文本）；也支持在列表页上传 .txt/.md 文件"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { KnowledgeDocumentApi, KnowledgeDocument } from '@/api/ai1/knowledge/document'

/** AI1 知识文档表单 */
defineOptions({ name: 'Ai1KnowledgeDocumentForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined as number | undefined,
  knowledgeBaseId: undefined as number | undefined,
  name: undefined as string | undefined,
  content: undefined as string | undefined
})
const originContent = ref<string>() // 修改前的内容
const formRules = reactive({
  name: [{ required: true, message: '文档名称不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '文档内容不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, knowledgeBaseId: number, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm(knowledgeBaseId)
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await KnowledgeDocumentApi.getKnowledgeDocument(id)
      originContent.value = formData.value.content
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as KnowledgeDocument
    if (formType.value === 'create') {
      await KnowledgeDocumentApi.createKnowledgeDocument(data)
      message.success(t('common.createSuccess'))
    } else {
      await KnowledgeDocumentApi.updateKnowledgeDocument(data)
      // 内容变化时，提示重新向量化
      if (data.content !== originContent.value) {
        message.success('修改成功，文档内容已变更，请重新向量化')
      } else {
        message.success(t('common.updateSuccess'))
      }
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = (knowledgeBaseId: number) => {
  formData.value = {
    id: undefined,
    knowledgeBaseId,
    name: undefined,
    content: undefined
  }
  originContent.value = undefined
  formRef.value?.resetFields()
}
</script>
