<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="150px"
    >
      <el-form-item label="社交平台" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_CLIENT_TYPE)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="社交 openid" prop="openid">
        <el-input v-model="formData.openid" placeholder="请输入社交 openid" />
      </el-form-item>
      <el-form-item label="社交 token" prop="token">
        <el-input v-model="formData.token" placeholder="请输入社交 token" />
      </el-form-item>
      <el-form-item label="原始 Token 数据" prop="rawTokenInfo">
        <el-input v-model="formData.rawTokenInfo" placeholder="请输入原始 Token 数据" />
      </el-form-item>
      <el-form-item label="用户昵称" prop="nickname">
        <el-input v-model="formData.nickname" placeholder="请输入用户昵称" />
      </el-form-item>
      <el-form-item label="用户头像" prop="avatar">
        <el-input v-model="formData.avatar" placeholder="请输入用户头像" />
      </el-form-item>
      <el-form-item label="原始用户数据" prop="rawUserInfo">
        <el-input v-model="formData.rawUserInfo" placeholder="请输入原始用户数据" />
      </el-form-item>
      <el-form-item label="最后一次的认证 code" prop="code">
        <el-input v-model="formData.code" placeholder="请输入最后一次的认证 code" />
      </el-form-item>
      <el-form-item label="最后一次的认证 state" prop="state">
        <el-input v-model="formData.state" placeholder="请输入最后一次的认证 state" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as SocialUserApi from '@/api/system/social/user'

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined,
  type: undefined,
  openid: undefined,
  token: undefined,
  rawTokenInfo: undefined,
  nickname: undefined,
  avatar: undefined,
  rawUserInfo: undefined,
  code: undefined,
  state: 0
})
const formRules = reactive({
  type: [{ required: true, message: '社交平台不能为空', trigger: 'blur' }],
  openid: [{ required: true, message: '社交 openid 不能为空', trigger: 'blur' }],
  nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }]
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
      formData.value = await SocialUserApi.getSocialUser(id)
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
    const data = formData.value as unknown as SocialUserApi.SocialUserVO
    if (formType.value === 'update') {
      await SocialUserApi.updateSocialUser(data)
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
    id: undefined,
    type: undefined,
    openid: undefined,
    token: undefined,
    rawTokenInfo: undefined,
    nickname: undefined,
    avatar: undefined,
    rawUserInfo: undefined,
    code: undefined,
    state: 0
  }
  formRef.value?.resetFields()
}
</script>
