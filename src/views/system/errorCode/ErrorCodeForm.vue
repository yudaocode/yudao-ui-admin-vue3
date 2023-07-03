<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="应用名" prop="applicationName">
        <el-input v-model="formData.applicationName" clearable placeholder="请输入应用名" />
      </el-form-item>
      <el-form-item label="错误码编码" prop="code">
        <el-input v-model="formData.code" clearable placeholder="请输入错误码编码" />
      </el-form-item>
      <el-form-item label="错误码提示" prop="message">
        <el-input v-model="formData.message" clearable placeholder="请输入错误码提示" />
      </el-form-item>
      <el-form-item label="备注" prop="memo">
        <el-input v-model="formData.memo" clearable placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as ErrorCodeApi from '@/api/system/errorCode'

defineOptions({ name: 'SystemErrorCodeForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
// 表单参数
const formData = ref({
  id: undefined,
  code: undefined,
  applicationName: '',
  message: '',
  memo: ''
})
// 表单校验
const formRules = reactive({
  applicationName: [{ required: true, message: '应用名不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '错误码编码不能为空', trigger: 'blur' }],
  message: [{ required: true, message: '错误码提示不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ErrorCodeApi.getErrorCode(id)
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
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as ErrorCodeApi.ErrorCodeVO
    if (formType.value === 'create') {
      await ErrorCodeApi.createErrorCode(data)
      message.success(t('common.createSuccess'))
    } else {
      await ErrorCodeApi.updateErrorCode(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 表单重置 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    applicationName: '',
    code: undefined,
    message: '',
    memo: ''
  }
  formRef.value?.resetFields()
}
</script>
