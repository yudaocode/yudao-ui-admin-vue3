<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="80px"
    >
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入标签名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as MpTagApi from '@/api/mp/tag'
import type { FormInstance, FormRules } from 'element-plus'

defineOptions({ name: 'MpTagForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref<'create' | 'update' | ''>('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  accountId: -1,
  name: ''
})
const formRules: FormRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }]
}
const formRef = ref<FormInstance | null>(null) // 表单 Ref

const emit = defineEmits<{
  (e: 'success'): void
}>()

/** 打开弹窗 */
const open = async (type: 'create' | 'update', accountId: number, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  formData.value.accountId = accountId
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await MpTagApi.getTag(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value?.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as MpTagApi.TagVO
    if (formType.value === 'create') {
      await MpTagApi.createTag(data)
      message.success(t('common.createSuccess'))
    } else {
      await MpTagApi.updateTag(data)
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
const resetForm = () => {
  formData.value = {
    accountId: -1,
    name: ''
  }
  formRef.value?.resetFields()
}
</script>
