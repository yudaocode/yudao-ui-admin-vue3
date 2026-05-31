<template>
  <el-dialog v-model="dialogVisible" title="封禁群" width="500" :close-on-click-modal="false">
    <el-form :model="formData" :rules="formRules" ref="formRef" label-width="80px">
      <el-form-item label="群名称">
        <span>{{ formData.groupName }}</span>
      </el-form-item>
      <el-form-item label="封禁原因" prop="reason">
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请输入封禁原因"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :loading="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import * as ManagerGroupApi from '@/api/im/manager/group'

defineOptions({ name: 'ImGroupBanForm' })

const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的显示
const formLoading = ref(false) // 提交的加载中
const formData = reactive({ id: 0, groupName: '', reason: '' }) // 封禁表单
const formRef = ref() // 表单 Ref
const formRules = {
  reason: [{ required: true, whitespace: true, message: '封禁原因不能为空', trigger: 'blur' }]
}

/** 打开弹窗 */
const open = (row: ManagerGroupApi.ImManagerGroupVO) => {
  formData.id = row.id
  formData.groupName = row.name
  formData.reason = ''
  dialogVisible.value = true
}
defineExpose({ open })

/** 提交封禁 */
const emit = defineEmits(['success']) // 操作成功后的回调
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    await ManagerGroupApi.banManagerGroup({ id: formData.id, reason: formData.reason })
    message.success('封禁成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
