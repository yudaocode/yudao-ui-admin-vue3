<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
    <!-- 账号配置 -->
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="邮箱地址" prop="mail">
        <el-input
          v-model="formData.mail"
          :disabled="formType !== 'create'"
          placeholder="请输入邮箱地址"
          @blur="handleMailBlur"
        />
      </el-form-item>
      <el-form-item label="邮箱服务" prop="providerId">
        <MailProviderSelect v-model="formData.providerId" :disabled="formType !== 'create'" />
      </el-form-item>
      <el-form-item label="登录名" prop="username">
        <el-input
          v-model="formData.username"
          :disabled="formType !== 'create'"
          placeholder="请输入登录名"
        />
      </el-form-item>
      <el-form-item label="授权码/密码" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          show-password
          autocomplete="new-password"
          :placeholder="formType === 'create' ? '请输入授权码或密码' : '留空表示不修改'"
        />
      </el-form-item>
      <el-form-item label="设为默认">
        <el-checkbox v-model="formData.defaultStatus">默认账号</el-checkbox>
      </el-form-item>
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
import * as AccountApi from '@/api/oa/mail/account'
import MailProviderSelect from '../provider/components/MailProviderSelect.vue'
import { CommonStatusEnum } from '@/utils/constants'
import type { FormRules } from 'element-plus'

defineOptions({ name: 'OaMailAccountForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗是否展示
const dialogTitle = ref('') // 弹窗标题
const formLoading = ref(false) // 表单加载状态
const formType = ref('create') // 表单类型
const formData = ref<AccountApi.MailAccountVO>({
  providerId: undefined,
  mail: '',
  username: '',
  password: '',
  defaultStatus: false,
  status: CommonStatusEnum.ENABLE
})
const formRules = reactive<FormRules>({
  mail: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确邮箱地址', trigger: 'blur' }
  ],
  providerId: [{ required: true, message: '请选择邮箱服务', trigger: 'change' }],
  username: [{ required: true, message: '请输入登录名', trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 校验新增账号的授权码或密码，修改时允许留空 */
function validatePassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (formType.value === 'create' && !value?.trim()) {
    callback(new Error('请输入授权码或密码'))
    return
  }
  callback()
}

/** 打开弹窗 */
async function open(type: string, id?: number) {
  dialogVisible.value = true
  formType.value = type
  dialogTitle.value = t('action.' + type)
  resetForm()
  formLoading.value = true
  try {
    if (id) {
      // 修改时，设置数据；密码不回显
      formData.value = { ...(await AccountApi.getMailAccount(id)), password: '' }
    }
  } finally {
    formLoading.value = false
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 邮箱输入后补充默认登录名 */
function handleMailBlur() {
  if (!formData.value.username) {
    formData.value.username = formData.value.mail
  }
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
      await AccountApi.createMailAccount(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await AccountApi.updateMailAccount(formData.value)
      message.success(t('common.updateSuccess'))
    }
    formData.value.password = ''
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
    providerId: undefined,
    mail: '',
    username: '',
    password: '',
    defaultStatus: false,
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}

/** 关闭时清理当前凭据 */
watch(dialogVisible, (visible) => {
  if (!visible) formData.value.password = ''
})
</script>
