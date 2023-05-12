<template>
  <el-form
    v-show="getShow"
    ref="formLogin"
    :model="loginData.loginForm"
    :rules="LoginRules"
    class="login-form"
    label-position="top"
    label-width="120px"
    size="large"
  >
    <el-row style="maring-left: -10px; maring-right: -10px">
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item>
          <LoginFormTitle style="width: 100%" />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item v-if="loginData.tenantEnable === 'true'" prop="tenantName">
          <el-input
            v-model="loginData.loginForm.tenantName"
            :placeholder="t('login.tenantNamePlaceholder')"
            :prefix-icon="iconHouse"
            type="primary"
            link
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item prop="username">
          <el-input
            v-model="loginData.loginForm.username"
            :placeholder="t('login.usernamePlaceholder')"
            :prefix-icon="iconAvatar"
          />
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item prop="password">
          <el-input
            v-model="loginData.loginForm.password"
            :placeholder="t('login.passwordPlaceholder')"
            :prefix-icon="iconLock"
            show-password
            type="password"
            @keyup.enter="getCode()"
          />
        </el-form-item>
      </el-col>
      <el-col
        :span="24"
        style="padding-left: 10px; padding-right: 10px; margin-top: -20px; margin-bottom: -20px"
      >
        <el-form-item>
          <el-row justify="space-between" style="width: 100%">
            <el-col :span="6">
              <el-checkbox v-model="loginData.loginForm.rememberMe">
                {{ t('login.remember') }}
              </el-checkbox>
            </el-col>
            <el-col :offset="6" :span="12">
              <el-link style="float: right" type="primary">{{ t('login.forgetPassword') }}</el-link>
            </el-col>
          </el-row>
        </el-form-item>
      </el-col>
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item>
          <XButton
            :loading="loginLoading"
            :title="t('login.login')"
            class="w-[100%]"
            type="primary"
            @click="getCode()"
          />
        </el-form-item>
      </el-col>
      <Verify
        ref="verify"
        :captchaType="captchaType"
        :imgSize="{ width: '400px', height: '200px' }"
        mode="pop"
        @success="handleLogin"
      />
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item>
          <el-row :gutter="5" justify="space-between" style="width: 100%">
            <el-col :span="8">
              <XButton
                :title="t('login.btnMobile')"
                class="w-[100%]"
                @click="setLoginState(LoginStateEnum.MOBILE)"
              />
            </el-col>
            <el-col :span="8">
              <XButton
                :title="t('login.btnQRCode')"
                class="w-[100%]"
                @click="setLoginState(LoginStateEnum.QR_CODE)"
              />
            </el-col>
            <el-col :span="8">
              <XButton
                :title="t('login.btnRegister')"
                class="w-[100%]"
                @click="setLoginState(LoginStateEnum.REGISTER)"
              />
            </el-col>
          </el-row>
        </el-form-item>
      </el-col>
      <el-divider content-position="center">{{ t('login.otherLogin') }}</el-divider>
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item>
          <div class="flex justify-between w-[100%]">
            <Icon
              v-for="(item, key) in socialList"
              :key="key"
              :icon="item.icon"
              :size="30"
              class="cursor-pointer anticon"
              color="#999"
              @click="doSocialLogin(item.type)"
            />
          </div>
        </el-form-item>
      </el-col>
      <el-divider content-position="center">萌新必读</el-divider>
      <el-col :span="24" style="padding-left: 10px; padding-right: 10px">
        <el-form-item>
          <div class="flex justify-between w-[100%]">
            <el-link href="https://doc.iocoder.cn/" target="_blank">📚开发指南</el-link>
            <el-link href="https://doc.iocoder.cn/video/" target="_blank">🔥视频教程</el-link>
            <el-link href="https://www.iocoder.cn/Interview/good-collection/" target="_blank">
              ⚡面试手册
            </el-link>
            <el-link href="http://static.yudao.iocoder.cn/mp/Aix9975.jpeg" target="_blank">
              🤝外包咨询
            </el-link>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>
<script lang="ts" name="LoginForm" setup>
import { ElLoading } from 'element-plus'
import LoginFormTitle from './LoginFormTitle.vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { useIcon } from '@/hooks/web/useIcon'

import * as authUtil from '@/utils/auth'
import { usePermissionStore } from '@/store/modules/permission'
import * as LoginApi from '@/api/login'
import { LoginStateEnum, useFormValid, useLoginState } from './useLogin'

const { t } = useI18n()
const message = useMessage()
const iconHouse = useIcon({ icon: 'ep:house' })
const iconAvatar = useIcon({ icon: 'ep:avatar' })
const iconLock = useIcon({ icon: 'ep:lock' })
const formLogin = ref()
const { validForm } = useFormValid(formLogin)
const { setLoginState, getLoginState } = useLoginState()
const { currentRoute, push } = useRouter()
const permissionStore = usePermissionStore()
const redirect = ref<string>('')
const loginLoading = ref(false)
const verify = ref()
const captchaType = ref('blockPuzzle') // blockPuzzle 滑块 clickWord 点击文字

const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

const LoginRules = {
  tenantName: [required],
  username: [required],
  password: [required]
}
const loginData = reactive({
  isShowPassword: false,
  captchaEnable: import.meta.env.VITE_APP_CAPTCHA_ENABLE,
  tenantEnable: import.meta.env.VITE_APP_TENANT_ENABLE,
  loginForm: {
    tenantName: '芋道源码',
    username: 'admin',
    password: 'admin123',
    captchaVerification: '',
    rememberMe: false
  }
})

const socialList = [
  { icon: 'ant-design:github-filled', type: 0 },
  { icon: 'ant-design:wechat-filled', type: 30 },
  { icon: 'ant-design:alipay-circle-filled', type: 0 },
  { icon: 'ant-design:dingtalk-circle-filled', type: 20 }
]

// 获取验证码
const getCode = async () => {
  // 情况一，未开启：则直接登录
  if (loginData.captchaEnable === 'false') {
    await handleLogin({})
  } else {
    // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
    // 弹出验证码
    verify.value.show()
  }
}
//获取租户ID
const getTenantId = async () => {
  if (loginData.tenantEnable === 'true') {
    const res = await LoginApi.getTenantIdByName(loginData.loginForm.tenantName)
    authUtil.setTenantId(res)
  }
}
// 记住我
const getCookie = () => {
  const loginForm = authUtil.getLoginForm()
  if (loginForm) {
    loginData.loginForm = {
      ...loginData.loginForm,
      username: loginForm.username ? loginForm.username : loginData.loginForm.username,
      password: loginForm.password ? loginForm.password : loginData.loginForm.password,
      rememberMe: loginForm.rememberMe ? true : false,
      tenantName: loginForm.tenantName ? loginForm.tenantName : loginData.loginForm.tenantName
    }
  }
}
// 登录
const handleLogin = async (params) => {
  loginLoading.value = true
  try {
    await getTenantId()
    const data = await validForm()
    if (!data) {
      return
    }
    loginData.loginForm.captchaVerification = params.captchaVerification
    const res = await LoginApi.login(loginData.loginForm)
    if (!res) {
      return
    }
    ElLoading.service({
      lock: true,
      text: '正在加载系统中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    if (loginData.loginForm.rememberMe) {
      authUtil.setLoginForm(loginData.loginForm)
    } else {
      authUtil.removeLoginForm()
    }
    authUtil.setToken(res)
    if (!redirect.value) {
      redirect.value = '/'
    }
    // 判断是否为SSO登录
    if (redirect.value.indexOf('sso') !== -1) {
      window.location.href = window.location.href.replace('/login?redirect=', '')
    } else {
      push({ path: redirect.value || permissionStore.addRouters[0].path })
    }
  } catch {
    loginLoading.value = false
  } finally {
    setTimeout(() => {
      const loadingInstance = ElLoading.service()
      loadingInstance.close()
    }, 400)
  }
}

// 社交登录
const doSocialLogin = async (type: number) => {
  if (type === 0) {
    message.error('此方式未配置')
  } else {
    loginLoading.value = true
    if (loginData.tenantEnable === 'true') {
      await message.prompt('请输入租户名称', t('common.reminder')).then(async ({ value }) => {
        const res = await LoginApi.getTenantIdByName(value)
        authUtil.setTenantId(res)
      })
    }
    // 计算 redirectUri
    const redirectUri =
      location.origin + '/social-login?type=' + type + '&redirect=' + (redirect.value || '/')
    // 进行跳转
    const res = await LoginApi.socialAuthRedirect(type, encodeURIComponent(redirectUri))
    window.location.href = res
  }
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
onMounted(() => {
  getCookie()
})
</script>

<style lang="scss" scoped>
:deep(.anticon) {
  &:hover {
    color: var(--el-color-primary) !important;
  }
}

.login-code {
  width: 100%;
  height: 38px;
  float: right;

  img {
    cursor: pointer;
    width: 100%;
    max-width: 100px;
    height: auto;
    vertical-align: middle;
  }
}
</style>
