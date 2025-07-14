<template>
  <el-form
    v-show="getShow"
    ref="formSmsResetPassword"
    :model="resetPasswordData"
    :rules="rules"
    class="login-form"
    label-position="top"
    label-width="120px"
    size="large"
  >
    <el-row class="mx-[-10px]">
      <!-- 租户名 -->
      <el-col :span="24" class="px-10px">
        <el-form-item>
          <LoginFormTitle class="w-full" />
        </el-form-item>
      </el-col>
      <el-col :span="24" class="px-10px">
        <el-form-item v-if="resetPasswordData.tenantEnable === 'true'" prop="tenantName">
          <el-input
            v-model="resetPasswordData.tenantName"
            :placeholder="t('login.tenantNamePlaceholder')"
            :prefix-icon="iconHouse"
            type="primary"
            link
          />
        </el-form-item>
      </el-col>
      <!-- 手机号 -->
      <el-col :span="24" class="px-10px">
        <el-form-item prop="mobile">
          <el-input
            v-model="resetPasswordData.mobile"
            :placeholder="t('login.mobileNumberPlaceholder')"
            :prefix-icon="iconCellphone"
          />
        </el-form-item>
      </el-col>
      <Verify
        ref="verify"
        :captchaType="captchaType"
        :imgSize="{ width: '400px', height: '200px' }"
        mode="pop"
        @success="getSmsCode"
      />
      <!-- 验证码 -->
      <el-col :span="24" class="px-10px">
        <el-form-item prop="code">
          <el-row :gutter="5" justify="space-between" style="width: 100%">
            <el-col :span="24">
              <el-input
                v-model="resetPasswordData.code"
                :placeholder="t('login.codePlaceholder')"
                :prefix-icon="iconCircleCheck"
              >
                <template #append>
                  <span
                    v-if="mobileCodeTimer <= 0"
                    class="getMobileCode"
                    style="cursor: pointer"
                    @click="getCode"
                  >
                    {{ t('login.getSmsCode') }}
                  </span>
                  <span v-if="mobileCodeTimer > 0" class="getMobileCode" style="cursor: pointer">
                    {{ mobileCodeTimer }}秒后可重新获取
                  </span>
                </template>
              </el-input>
              <!-- </el-button> -->
            </el-col>
          </el-row>
        </el-form-item>
      </el-col>
      <el-col :span="24" class="px-10px">
        <el-form-item prop="password">
          <InputPassword
            v-model="resetPasswordData.password"
            :placeholder="t('login.passwordPlaceholder')"
            class="w-full"
            :strength="true"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" class="px-10px">
        <el-form-item prop="check_password">
          <InputPassword
            v-model="resetPasswordData.check_password"
            :placeholder="t('login.checkPassword')"
            class="w-full"
            :strength="true"
          />
        </el-form-item>
      </el-col>
      <!-- 登录按钮 / 返回按钮 -->
      <el-col :span="24" class="px-10px">
        <el-form-item>
          <XButton
            :loading="loginLoading"
            :title="t('login.resetPassword')"
            class="w-full"
            type="primary"
            @click="resetPassword()"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" class="px-10px">
        <el-form-item>
          <XButton
            :loading="loginLoading"
            :title="t('login.backLogin')"
            class="w-full"
            @click="handleBackLogin()"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" setup>
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { useIcon } from '@/hooks/web/useIcon'

import { sendSmsCode, smsResetPassword } from '@/api/login'
import LoginFormTitle from './LoginFormTitle.vue'
import { LoginStateEnum, useFormValid, useLoginState } from './useLogin'
import { ElLoading } from 'element-plus'
import * as authUtil from '@/utils/auth'
import * as LoginApi from '@/api/login'
defineOptions({ name: 'ForgetPasswordForm' })
const verify = ref()

const { t } = useI18n()
const message = useMessage()
const { currentRoute } = useRouter()
const formSmsResetPassword = ref()
const loginLoading = ref(false)
const iconHouse = useIcon({ icon: 'ep:house' })
const iconCellphone = useIcon({ icon: 'ep:cellphone' })
const iconCircleCheck = useIcon({ icon: 'ep:circle-check' })
const { validForm } = useFormValid(formSmsResetPassword)
const { handleBackLogin, getLoginState, setLoginState } = useLoginState()
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.RESET_PASSWORD)
const captchaType = ref('blockPuzzle') // blockPuzzle 滑块 clickWord 点击文字

const validatePass2 = (_rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== resetPasswordData.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  tenantName: [{ required: true, min: 2, max: 20, trigger: 'blur', message: '长度为4到16位' }],
  mobile: [{ required: true, min: 11, max: 11, trigger: 'blur', message: '手机号长度为11位' }],
  password: [
    {
      required: true,
      min: 4,
      max: 16,
      validator: validatePass2,
      trigger: 'blur',
      message: '密码长度为4到16位'
    }
  ],
  check_password: [{ required: true, validator: validatePass2, trigger: 'blur' }],
  code: [required]
}

const resetPasswordData = reactive({
  captchaEnable: import.meta.env.VITE_APP_CAPTCHA_ENABLE,
  tenantEnable: import.meta.env.VITE_APP_TENANT_ENABLE,
  tenantName: '',
  username: '',
  password: '',
  check_password: '',
  mobile: '',
  code: ''
})

const smsVO = reactive({
  tenantName: '',
  mobile: '',
  captchaVerification: '',
  scene: 23
})
const mobileCodeTimer = ref(0)
const redirect = ref<string>('')

// 获取验证码
const getCode = async () => {
  // 情况一，未开启：则直接发送验证码
  if (resetPasswordData.captchaEnable === 'false') {
    await getSmsCode({})
  } else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行发送验证码
    // 弹出验证码
    verify.value.show()
  }
}

const getSmsCode = async (params) => {
  if (resetPasswordData.tenantEnable === 'true') {
    await getTenantId()
  }
  smsVO.captchaVerification = params.captchaVerification
  smsVO.mobile = resetPasswordData.mobile
  await sendSmsCode(smsVO).then(async () => {
    message.success(t('login.SmsSendMsg'))
    // 设置倒计时
    mobileCodeTimer.value = 60
    let msgTimer = setInterval(() => {
      mobileCodeTimer.value = mobileCodeTimer.value - 1
      if (mobileCodeTimer.value <= 0) {
        clearInterval(msgTimer)
      }
    }, 1000)
  })
}
watch(
  () => currentRoute.value,
  (route: RouteLocationNormalizedLoaded) => {
    redirect.value = route?.query?.redirect as string
  },
  {
    immediate: true
  }
)

const getTenantId = async () => {
  if (resetPasswordData.tenantEnable === 'true') {
    const res = await LoginApi.getTenantIdByName(resetPasswordData.tenantName)
    if (res == null) {
      message.error(t('login.invalidTenantName'))
      throw t('login.invalidTenantName')
    }
    authUtil.setTenantId(res)
  }
}

// 重置密码
const resetPassword = async () => {
  const data = await validForm()
  if (!data) return
  await getTenantId()
  loginLoading.value = true
  await smsResetPassword(resetPasswordData)
    .then(async () => {
      message.success(t('login.resetPasswordSuccess'))
      setLoginState(LoginStateEnum.LOGIN)
    })
    .catch(() => {})
    .finally(() => {
      loginLoading.value = false
      setTimeout(() => {
        const loadingInstance = ElLoading.service()
        loadingInstance.close()
      }, 400)
    })
}
</script>

<style lang="scss" scoped>
:deep(.anticon) {
  &:hover {
    color: var(--el-color-primary) !important;
  }
}

.smsbtn {
  margin-top: 33px;
}
</style>
