<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="90px"
    >
      <el-form-item label="分组名称" prop="name">
        <el-input v-model.trim="formData.name" maxlength="100" placeholder="请输入分组名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as KnowledgeGroupApi from '@/api/pms/kb/library/group'
import type { FormRules } from 'element-plus'
import { PmsKnowledgeGroupType } from '@/views/pms/kb/utils/constants'

defineOptions({ name: 'PmsKnowledgeGroupForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单提交中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<KnowledgeGroupApi.PmsKnowledgeGroupVO>(getDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await KnowledgeGroupApi.getKnowledgeGroup(id)
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
      await KnowledgeGroupApi.createKnowledgeGroup(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await KnowledgeGroupApi.updateKnowledgeGroup(formData.value)
      message.success(t('common.updateSuccess'))
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

/** 获得默认表单数据 */
function getDefaultFormData(): KnowledgeGroupApi.PmsKnowledgeGroupVO {
  return {
    id: undefined as unknown as number,
    name: '',
    sort: 0,
    type: PmsKnowledgeGroupType.CUSTOM
  }
}
</script>
