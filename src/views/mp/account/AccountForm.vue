<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="微信号" prop="account">
        <template #label>
          <span>
            <el-tooltip
              content="在微信公众平台（mp.weixin.qq.com）的菜单 [设置与开发 - 公众号设置 - 账号详情] 中能找到「微信号」"
              placement="top"
            >
              <Icon icon="ep:question-filled" style="vertical-align: middle" />
            </el-tooltip>
            微信号
          </span>
        </template>
        <el-input v-model="formData.account" placeholder="请输入微信号" />
      </el-form-item>
      <el-form-item label="appId" prop="appId">
        <template #label>
          <span>
            <el-tooltip
              content="在微信公众平台（mp.weixin.qq.com）的菜单 [设置与开发 - 公众号设置 - 基本设置] 中能找到「开发者ID(AppID)」"
              placement="top"
            >
              <Icon icon="ep:question-filled" style="vertical-align: middle" />
            </el-tooltip>
            appId
          </span>
        </template>
        <el-input v-model="formData.appId" placeholder="请输入公众号 appId" />
      </el-form-item>
      <el-form-item label="appSecret" prop="appSecret">
        <template #label>
          <span>
            <el-tooltip
              content="在微信公众平台（mp.weixin.qq.com）的菜单 [设置与开发 - 公众号设置 - 基本设置] 中能找到「开发者密码(AppSecret)」"
              placement="top"
            >
              <Icon icon="ep:question-filled" style="vertical-align: middle" />
            </el-tooltip>
            appSecret
          </span>
        </template>
        <el-input v-model="formData.appSecret" placeholder="请输入公众号 appSecret" />
      </el-form-item>
      <el-form-item label="token" prop="token">
        <el-input v-model="formData.token" placeholder="请输入公众号token" />
      </el-form-item>
      <el-form-item label="消息加解密密钥" prop="aesKey">
        <el-input v-model="formData.aesKey" placeholder="请输入消息加解密密钥" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" placeholder="请输入备注" type="textarea" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as AccountApi from '@/api/mp/account'

defineOptions({ name: 'MpAccountForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  name: '',
  account: '',
  appId: '',
  appSecret: '',
  token: '',
  aesKey: '',
  remark: ''
})
const rules = reactive({
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  account: [{ required: true, message: '公众号账号不能为空', trigger: 'blur' }],
  appId: [{ required: true, message: '公众号 appId 不能为空', trigger: 'blur' }],
  appSecret: [{ required: true, message: '公众号密钥不能为空', trigger: 'blur' }],
  token: [{ required: true, message: '公众号 token 不能为空', trigger: 'blur' }]
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
      formData.value = await AccountApi.getAccount(id)
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
    const data = formData.value
    if (formType.value === 'create') {
      await AccountApi.createAccount(data)
      message.success(t('common.createSuccess'))
    } else {
      await AccountApi.updateAccount(data)
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
    name: '',
    account: '',
    appId: '',
    appSecret: '',
    token: '',
    aesKey: '',
    remark: ''
  }
  formRef.value?.resetFields()
}
</script>
