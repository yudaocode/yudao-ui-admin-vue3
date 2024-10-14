<template>
  <el-image
    src="https://shopro.sheepjs.com/admin/static/images/shop/decorate/walletCardStyle.png"
  />
</template>
<script setup lang="ts">
import { UserWalletProperty } from './config'

/** 用户资产 */
defineOptions({ name: 'UserWallet' })
// 定义属性
defineProps<{ property: UserWalletProperty }>()
</script>

<style scoped lang="scss"></style>
