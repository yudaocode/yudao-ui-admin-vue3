<template>
  <el-descriptions :column="2">
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 等级 " icon="svg-icon:member_level" />
      </template>
      {{ user.levelName || '无' }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 成长值 " icon="ep:suitcase" />
      </template>
      {{ user.experience || 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 当前积分 " icon="ep:coin" />
      </template>
      {{ user.point || 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 总积分 " icon="ep:coin" />
      </template>
      {{ user.totalPoint || 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 当前余额 " icon="svg-icon:member_balance" />
      </template>
      {{ fenToYuan(wallet.balance || 0) }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 支出金额 " icon="svg-icon:member_expenditure_balance" />
      </template>
      {{ fenToYuan(wallet.totalExpense || 0) }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 充值金额 " icon="svg-icon:member_recharge_balance" />
      </template>
      {{ fenToYuan(wallet.totalRecharge || 0) }}
    </el-descriptions-item>
  </el-descriptions>
</template>
<script setup lang="ts">
import { DescriptionsItemLabel } from '@/components/Descriptions'
import * as UserApi from '@/api/member/user'
import * as WalletApi from '@/api/pay/wallet/balance'
import { UserTypeEnum } from '@/utils/constants'
import { fenToYuan } from '@/utils'
const props = defineProps<{ user: UserApi.UserVO; wallet: WalletApi.WalletVO }>() // 用户信息
</script>
<style scoped lang="scss">
.cell-item {
  display: inline;
}

.cell-item::after {
  content: ':';
}
</style>
