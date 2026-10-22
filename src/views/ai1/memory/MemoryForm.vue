<template>
  <Dialog title="修改长期记忆" v-model="dialogVisible" width="1000px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="记忆内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          :rows="20"
          maxlength="65535"
          placeholder="请输入记忆内容"
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
import { MemoryApi } from '@/api/ai1/memory'

/** AI1 长期记忆表单 */
defineOptions({ name: 'Ai1MemoryForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formData = ref({
  id: 0,
  content: ''
})
const formRules = reactive({
  content: [{ required: true, message: '记忆内容不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (id: number) => {
  dialogVisible.value = true
  formData.value = { id, content: '' }
  formRef.value?.resetFields()
  formLoading.value = true
  try {
    const data = await MemoryApi.getMemory(id)
    // 打开前已被删除
    if (!data) {
      message.warning('该记忆不存在或已被删除')
      dialogVisible.value = false
      return
    }
    formData.value = { id: data.id, content: data.content }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求：只提交正文，归属与归档进度由服务端维护
  formLoading.value = true
  try {
    await MemoryApi.updateMemory(formData.value)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
