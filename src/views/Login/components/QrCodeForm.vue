<template>
  <el-row class="login-form" v-show="getShow" style="margin-right: -10px; margin-left: -10px">
    <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
      <LoginFormTitle style="width: 100%" />
    </el-col>
    <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
      <el-card class="mb-10px text-center" shadow="hover">
        <Qrcode :logo="logoImg" />
      </el-card>
    </el-col>
    <el-divider class="enter-x">{{ t('login.qrcode') }}</el-divider>
    <el-col :span="24" style="padding-right: 10px; padding-left: 10px">
      <div class="mt-15px w-[100%]">
        <XButton :title="t('login.backLogin')" class="w-[100%]" @click="handleBackLogin()" />
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
