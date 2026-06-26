<template>
  <el-row v-show="getShow" class="login-form mx-[-10px]">
    <el-col :span="24" class="px-10px">
      <LoginFormTitle class="w-full" />
    </el-col>
    <el-col :span="24" class="px-10px">
      <el-card class="mb-10px text-center" shadow="hover">
        <Qrcode :logo="logoImg" />
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

import LoginFormTitle from './LoginFormTitle.vue'
import { LoginStateEnum, useLoginState } from './useLogin'

defineOptions({ name: 'QrCodeForm' })

const { t } = useI18n()
const { handleBackLogin, getLoginState } = useLoginState()
const getShow = computed(() => unref(getLoginState) === LoginStateEnum.QR_CODE)
</script>
