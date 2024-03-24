<template>
  <Dialog v-model="dialogVisible" title="减签" width="500">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="减签任务" prop="id">
        <el-radio-group v-model="formData.id">
          <el-radio-button v-for="item in childrenTaskList" :key="item.id" :label="item.id">
            {{ item.name }}
            ({{ item.assigneeUser?.deptName || item.ownerUser?.deptName }} -
            {{ item.assigneeUser?.nickname || item.ownerUser?.nickname }})
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="减签理由" prop="reason">
        <el-input v-model="formData.reason" clearable placeholder="请输入减签理由" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as TaskApi from '@/api/bpm/task'
import { isEmpty } from '@/utils/is'

defineOptions({ name: 'TaskSignDeleteForm' })

const message = useMessage() // 消息弹窗
const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中
const formData = ref({
  id: '',
  reason: ''
})
const formRules = ref({
  id: [{ required: true, message: '必须选择减签任务', trigger: 'change' }],
  reason: [{ required: true, message: '减签理由不能为空', trigger: 'blur' }]
})

const formRef = ref() // 表单 Ref
const childrenTaskList = ref([])
/** 打开弹窗 */
const open = async (id: string) => {
  childrenTaskList.value = await TaskApi.getChildrenTaskList(id)
  if (isEmpty(childrenTaskList.value)) {
    message.warning('当前没有可减签的任务')
    return false
  }
  dialogVisible.value = true
  resetForm()
}
defineExpose({ open }) // 提供 openModal 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    await TaskApi.signDeleteTask(formData.value)
    message.success('减签成功')
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: '',
    reason: ''
  }
  formRef.value?.resetFields()
}
</script>
