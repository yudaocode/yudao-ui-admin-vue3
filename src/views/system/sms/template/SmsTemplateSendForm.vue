<template>
  <Dialog title="测试" v-model="modelVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="140px"
      v-loading="formLoading"
    >
      <el-form-item label="模板内容" prop="content">
        <el-input
          v-model="formData.content"
          type="textarea"
          placeholder="请输入模板内容"
          readonly
        />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="formData.mobile" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item
        v-for="param in formData.params"
        :key="param"
        :label="'参数 {' + param + '}'"
        :prop="'templateParams.' + param"
      >
        <el-input
          v-model="formData.templateParams[param]"
          :placeholder="'请输入 ' + param + ' 参数'"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="modelVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as SmsTemplateApi from '@/api/system/sms/smsTemplate'
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用

// 发送短信表单相关
const formData = ref({
  content: '',
  params: {},
  mobile: '',
  templateCode: '',
  templateParams: new Map()
})
const formRules = reactive({
  mobile: [{ required: true, message: '手机不能为空', trigger: 'blur' }],
  templateCode: [{ required: true, message: '模版编码不能为空', trigger: 'blur' }],
  templateParams: {}
})
const formRef = ref() // 表单 Ref

const open = async (id: number) => {
  modelVisible.value = true
  resetForm()
  // 设置数据
  formLoading.value = true
  try {
    const data = await SmsTemplateApi.getSmsTemplate(id)
    // 设置动态表单
    formData.value.content = data.content
    formData.value.params = data.params
    formData.value.templateCode = data.code
    formData.value.templateParams = data.params.reduce((obj, item) => {
      obj[item] = '' // 给每个动态属性赋值，避免无法读取
      return obj
    }, {})
    formRules.templateParams = data.params.reduce((obj, item) => {
      obj[item] = { required: true, message: '参数 ' + item + ' 不能为空', trigger: 'blur' }
      return obj
    }, {})
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as SmsTemplateApi.SendSmsReqVO
    const logId = await SmsTemplateApi.sendSms(data)
    if (logId) {
      message.success('提交发送成功！发送结果，见发送日志编号：' + logId)
    }
    modelVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    content: '',
    params: {},
    mobile: '',
    templateCode: '',
    templateParams: new Map()
  }
  formRef.value?.resetFields()
}
</script>
