<template>
  <el-row v-show="getShow" class="login-form mx-[-10px]">
    <el-col :span="24" class="px-10px">
      <LoginFormTitle class="w-full" />
    </el-col>
    <el-col :span="24" class="px-10px">
      <el-card v-loading="loading" class="mb-10px min-h-260px text-center" shadow="hover">
        <Qrcode
          v-if="qrcode"
          :text="qrcode.qrContent"
          :logo="logoImg"
          :disabled="!!error"
          disabled-text="请刷新二维码"
        />
        <p class="mt-12px text-14px">{{ error || '请使用管理后台手机端扫一扫，并确认登录' }}</p>
        <el-button v-if="error" class="mt-8px" @click="createQrcode">刷新二维码</el-button>
      </el-card>
    </el-col>
    <el-divider class="enter-x">{{ t('login.qrcode') }}</el-divider>
    <el-col :span="24" class="px-10px">
      <div class="mt-4 w-full">
        <el-button class="w-full" @click="handleBackLogin()">{{ t('login.backLogin') }}</el-button>
      </div>
    </el-col>
  </el-row>
</template>
<script lang="ts" setup>
import logoImg from '@/assets/imgs/logo.png'
import * as LoginApi from '@/api/login'
import { AuthQrcodeStatusEnum } from '@/api/login'
import type { AuthQrcodeCreateRespVO } from '@/api/login'
import { setToken } from '@/utils/auth'
import { deleteUserCache } from '@/hooks/web/useCache'

import LoginFormTitle from './LoginFormTitle.vue'
import { LoginStateEnum, useLoginState } from './useLogin'

defineOptions({ name: 'QrCodeForm' })

const { t } = useI18n()
const { handleBackLogin, getLoginState } = useLoginState()
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.QR_CODE)
const route = useRoute()
const router = useRouter()
const qrcode = ref<AuthQrcodeCreateRespVO>()
const loading = ref(false)
const error = ref('')
let stopPolling = () => {}

const createQrcode = async () => {
  stopPolling()
  let stopped = false
  let pollTimer: ReturnType<typeof setTimeout> | undefined
  stopPolling = () => {
    stopped = true
    clearTimeout(pollTimer)
  }
  const fail = () => {
    if (stopped) return
    stopPolling()
    loading.value = false
    error.value = qrcode.value
      ? '二维码已失效，请刷新后重新扫码'
      : '二维码生成失败，请刷新后重试'
  }
  qrcode.value = undefined
  error.value = ''
  loading.value = true
  try {
    const ticket = await LoginApi.createQrcode()
    if (stopped) return
    qrcode.value = ticket
    loading.value = false

    const poll = async () => {
      try {
        const result = await LoginApi.pollQrcode({
          qrcodeId: ticket.qrcodeId,
          secret: ticket.secret
        })
        if (stopped) return
        if (result.status === AuthQrcodeStatusEnum.WAITING) {
          pollTimer = setTimeout(poll, 2000)
          return
        }
        if (result.status !== AuthQrcodeStatusEnum.CONFIRMED || !result.login) {
          fail()
          return
        }
        stopPolling()
        deleteUserCache()
        setToken(result.login)
        // 重载以清除内存中的用户/权限及动态路由，目标只允许同源站内路径。
        const redirect = route.query.redirect
        let target = new URL(router.resolve('/').href, location.origin)
        try {
          const path = typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/'
          const candidate = new URL(router.resolve(path).href, location.origin)
          if (candidate.origin === location.origin) target = candidate
        } catch {
          // 无效的跳转参数返回首页。
        }
        location.assign(target.pathname + target.search + target.hash)
      } catch {
        fail()
      }
    }
    pollTimer = setTimeout(poll, 2000)
  } catch {
    fail()
  }
}

watch(
  getShow,
  (visible) => {
    stopPolling()
    if (visible) createQrcode()
  },
  { immediate: true }
)
onBeforeUnmount(() => stopPolling())
</script>
