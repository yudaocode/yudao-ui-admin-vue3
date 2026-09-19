<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
    <!-- 邮箱服务配置 -->
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入邮箱服务名称" />
      </el-form-item>
      <template v-for="protocol in protocols" :key="protocol.key">
        <el-divider content-position="left">{{ protocol.label }}</el-divider>
        <el-form-item
          label="服务器域名"
          :prop="protocol.key + '.host'"
          :rules="[{ required: true, message: '请输入服务器域名', trigger: 'blur' }]"
        >
          <el-input v-model="formData[protocol.key].host" placeholder="请输入服务器域名" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="formData[protocol.key].port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="连接加密">
          <el-radio-group
            :model-value="formData[protocol.key].sslEnable"
            @change="(value) => handleSecurityChange(protocol.key, Boolean(value))"
          >
            <el-radio :value="true">SSL</el-radio>
            <el-radio :value="false">STARTTLS</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>
      <el-form-item label="状态">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <!-- 表单操作 -->
    <template #footer>
      <el-button type="primary" :disabled="formLoading" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as ProviderApi from '@/api/oa/mail/provider'

defineOptions({ name: 'OaMailProviderForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载状态
const formType = ref('create') // 表单类型
const protocols = [
  { key: 'imap' as const, label: 'IMAP 收信配置' },
  { key: 'smtp' as const, label: 'SMTP 发信配置' }
] // 协议分组
const formData = ref<ProviderApi.MailProviderVO>({
  name: '',
  imap: {
    host: '',
    port: 993,
    sslEnable: true,
    starttlsEnable: false
  },
  smtp: {
    host: '',
    port: 465,
    sslEnable: true,
    starttlsEnable: false
  },
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive({ name: [{ required: true, message: '请输入名称', trigger: 'blur' }] })
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProviderApi.getMailProvider(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 切换连接加密方式 */
function handleSecurityChange(protocol: string, sslEnable: boolean) {
  const config = protocol === 'imap' ? formData.value.imap : formData.value.smtp
  config.sslEnable = sslEnable
  config.starttlsEnable = !sslEnable
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
async function submitForm() {
  // 校验表单
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await ProviderApi.createMailProvider(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await ProviderApi.updateMailProvider(formData.value)
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
function resetForm() {
  formData.value = {
    name: '',
    imap: {
      host: '',
      port: 993,
      sslEnable: true,
      starttlsEnable: false
    },
    smtp: {
      host: '',
      port: 465,
      sslEnable: true,
      starttlsEnable: false
    },
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}
</script>
