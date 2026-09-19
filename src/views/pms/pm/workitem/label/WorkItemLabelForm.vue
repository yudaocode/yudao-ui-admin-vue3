<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="460px">
    <!-- 工作项标签表单 -->
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="formData.name" maxlength="50" placeholder="请输入标签名称" />
      </el-form-item>
      <el-form-item label="标签颜色" prop="color">
        <el-color-picker v-model="formData.color" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as WorkItemLabelApi from '@/api/pms/pm/workitem/label'

defineOptions({ name: 'PmsWorkItemLabelForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗是否显示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单提交中
const formData = ref<WorkItemLabelApi.PmsWorkItemLabelVO>(getDefaultFormData()) // 表单数据
const formRules = reactive({
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  color: [{ required: true, message: '请选择标签颜色', trigger: 'change' }]
}) // 表单校验规则
const formRef = ref() // 表单 Ref
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调

/** 打开弹窗 */
async function open(id?: number) {
  dialogVisible.value = true
  dialogTitle.value = id ? '编辑标签' : '新增标签'
  resetForm()
  if (!id) return
  const label = (await WorkItemLabelApi.getWorkItemLabelList()).find((item) => item.id === id)
  if (label) formData.value = { ...label }
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
    if (formData.value.id) {
      await WorkItemLabelApi.updateWorkItemLabel(formData.value)
      message.success('更新成功')
    } else {
      await WorkItemLabelApi.createWorkItemLabel(formData.value)
      message.success('创建成功')
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
function getDefaultFormData(): WorkItemLabelApi.PmsWorkItemLabelVO {
  return {
    name: '',
    color: '#409EFF'
  }
}
</script>
