<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
    <!-- 项目分组表单 -->
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="92px"
    >
      <el-form-item label="分组名称" prop="name">
        <el-input
          v-model.trim="formData.name"
          maxlength="20"
          placeholder="请输入分组名称"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as ProjectGroupApi from '@/api/pms/pm/project/group'
import type { FormRules } from 'element-plus'

defineOptions({ name: 'PmsProjectGroupForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单提交中
const formType = ref('') // 表单类型：create - 新增；update - 修改
const formData = ref<ProjectGroupApi.PmsProjectGroupVO>(getDefaultFormData()) // 表单数据
const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '分组名称不能为空', trigger: 'blur' },
    { max: 20, message: '分组名称不能超过 20 个字符', trigger: 'blur' }
  ]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
function open(type: string, group?: ProjectGroupApi.PmsProjectGroupVO) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (group) {
    formData.value = { ...group }
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
      await ProjectGroupApi.createProjectGroup(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ProjectGroupApi.updateProjectGroup(formData.value)
      message.success(t('common.updateSuccess'))
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
function getDefaultFormData(): ProjectGroupApi.PmsProjectGroupVO {
  return {
    name: ''
  }
}
</script>
