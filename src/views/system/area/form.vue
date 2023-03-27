<template>
  <Dialog title="IP 查询" v-model="modelVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="80px"
      v-loading="formLoading"
    >
      <el-form-item label="IP" prop="ip">
        <el-input v-model="formData.ip" placeholder="请输入 IP 地址" />
      </el-form-item>
      <el-form-item label="地址" prop="result">
        <el-input v-model="formData.result" readonly placeholder="展示查询 IP 结果" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="modelVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as AreaApi from '@/api/system/area'
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：提交的按钮禁用
const formData = ref({
  ip: '',
  result: undefined
})
const formRules = reactive({
  ip: [{ required: true, message: 'IP 地址不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const openModal = async () => {
  modelVisible.value = true
  resetForm()
}
defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    formData.value.result = await AreaApi.getAreaByIp(formData.value.ip!.trim())
    message.success('查询成功')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    ip: '',
    result: undefined
  }
  formRef.value?.resetFields()
}
</script>
