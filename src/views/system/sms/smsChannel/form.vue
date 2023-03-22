<template>
  <Dialog :title="modelTitle" v-model="modelVisible">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" v-loading="formLoading">
      <el-form-item label="短信签名" prop="signature">
        <el-input v-model="form.signature" placeholder="请输入短信签名" />
      </el-form-item>
      <el-form-item label="渠道编码" prop="code">
        <el-select v-model="form.code" placeholder="请选择渠道编码" clearable>
          <el-option
            v-for="dict in getDictOptions(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="启用状态">
        <el-radio-group v-model="form.status">
          <el-radio
            v-for="dict in getDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="parseInt(dict.value)"
            >{{ dict.label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item label="短信 API 的账号" prop="apiKey">
        <el-input v-model="form.apiKey" placeholder="请输入短信 API 的账号" />
      </el-form-item>
      <el-form-item label="短信 API 的密钥" prop="apiSecret">
        <el-input v-model="form.apiSecret" placeholder="请输入短信 API 的密钥" />
      </el-form-item>
      <el-form-item label="短信发送回调 URL" prop="callbackUrl">
        <el-input v-model="form.callbackUrl" placeholder="请输入短信发送回调 URL" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
        <el-button @click="modelVisible = false">取 消</el-button>
      </div>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getDictOptions } from '@/utils/dict'
import * as SmsChannelApi from '@/api/system/sms/smsChannel'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const modelVisible = ref(false) // 弹窗的是否展示
const modelTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const form = ref({
  id: undefined,
  signature: '',
  code: '',
  status: '',
  remark: '',
  apiKey: '',
  apiSecret: '',
  callbackUrl: ''
})
const rules = reactive({
  signature: [{ required: true, message: '短信签名不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '渠道编码不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '启用状态不能为空', trigger: 'blur' }],
  apiKey: [{ required: true, message: '短信 API 的账号不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const openModal = async (type: string, id?: number) => {
  modelVisible.value = true
  modelTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      form.value = await SmsChannelApi.getSmsChannelApi(id)
      console.log(form)
    } finally {
      formLoading.value = false
    }
  }
}

defineExpose({ openModal }) // 提供 openModal 方法，用于打开弹窗

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
    const data = unref(formRef)?.formModel as SmsChannelApi.SmsChannelVO
    if (formType.value === 'create') {
      await SmsChannelApi.createSmsChannelApi(data)
      message.success(t('common.createSuccess'))
    } else {
      await SmsChannelApi.updateSmsChannelApi(data)
      message.success(t('common.updateSuccess'))
    }
    modelVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  form.value = {
    id: undefined,
    signature: '',
    code: '',
    status: '',
    remark: '',
    apiKey: '',
    apiSecret: '',
    callbackUrl: ''
  }
  formRef.value?.resetFields()
}
</script>
