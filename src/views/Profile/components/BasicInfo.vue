<template>
  <el-form ref="formRef" :label-width="200" :model="formData" :rules="rules" @submit.prevent>
    <el-form-item :label="t('profile.user.nickname')" prop="nickname">
      <el-input
        v-model="formData.nickname"
        :placeholder="t('common.inputText') + t('profile.user.nickname')"
        clearable
      />
    </el-form-item>
    <el-form-item :label="t('profile.user.mobile')" prop="mobile">
      <el-input
        v-model="formData.mobile"
        :placeholder="t('common.inputText') + t('profile.user.mobile')"
        clearable
      />
    </el-form-item>
    <el-form-item :label="t('profile.user.email')" prop="email">
      <el-input
        v-model="formData.email"
        :placeholder="t('common.inputText') + t('profile.user.email')"
        clearable
      />
    </el-form-item>
    <el-form-item :label="t('profile.user.sex')" prop="sex">
      <el-radio-group v-model="formData.sex">
        <el-radio :value="1">{{ t('profile.user.man') }}</el-radio>
        <el-radio :value="2">{{ t('profile.user.woman') }}</el-radio>
      </el-radio-group>
    </el-form-item>
  </el-form>
  <div style="text-align: center">
    <el-button type="primary" @click="submit()">{{ t('common.save') }}</el-button>
    <el-button type="danger" @click="init()">{{ t('common.reset') }}</el-button>
  </div>
</template>
<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { cloneDeep } from 'lodash-es'
import {
  getUserProfile,
  updateUserProfile,
  UserProfileUpdateReqVO
} from '@/api/system/user/profile'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'BasicInfo' })

const { t } = useI18n()
const message = useMessage() // 消息弹窗
const userStore = useUserStore()

// 定义事件
const emit = defineEmits<{
  (e: 'success'): void
}>()

// 表单校验（提示文案在校验时按当前语言取值，不刷新切换语言后同样生效）
const rules = reactive<FormRules>({
  nickname: [{ required: true, message: () => t('profile.rules.nickname'), trigger: 'blur' }],
  email: [
    { required: true, message: () => t('profile.rules.mail'), trigger: 'blur' },
    {
      type: 'email',
      message: () => t('profile.rules.truemail'),
      trigger: ['blur', 'change']
    }
  ],
  mobile: [
    { required: true, message: () => t('profile.rules.phone'), trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: () => t('profile.rules.truephone'),
      trigger: 'blur'
    }
  ]
})
// 表单数据：除可编辑字段外，保留接口返回的其它字段（如 avatar），提交时一并传回
const formData = ref<Recordable>({
  nickname: '',
  mobile: '',
  email: '',
  sex: 0
})
const formRef = ref<FormInstance>() // 表单 Ref

// 监听 userStore 中头像的变化，同步更新表单数据
watch(
  () => userStore.getUser.avatar,
  (newAvatar) => {
    if (newAvatar) {
      formData.value.avatar = newAvatar
    }
  }
)

const submit = () => {
  const elForm = unref(formRef)
  if (!elForm) return
  elForm.validate(async (valid) => {
    if (valid) {
      const data = formData.value as UserProfileUpdateReqVO
      await updateUserProfile(data)
      message.success(t('common.updateSuccess'))
      const profile = await init()
      await userStore.setUserNicknameAction(profile.nickname)
      // 发送成功事件
      emit('success')
    }
  })
}

const init = async () => {
  const res = await getUserProfile()
  // 合并接口返回的全部字段（隔离接口对象，避免编辑时改动原数据）
  Object.assign(formData.value, cloneDeep(res))
  return res
}

onMounted(async () => {
  await init()
})
</script>
