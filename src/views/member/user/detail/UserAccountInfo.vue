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
    <!-- TODO 芋艿：后续接入余额、支付金额 -->
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 当前余额 " icon="svg-icon:member_balance" />
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 支出金额 " icon="svg-icon:member_expenditure_balance" />
      </template>
      {{ 0 }}
    </el-descriptions-item>
    <el-descriptions-item>
      <template #label>
        <descriptions-item-label label=" 充值金额 " icon="svg-icon:member_recharge_balance" />
      </template>
      {{ 0 }}
    </el-descriptions-item>
  </el-descriptions>
</template>
<script setup lang="ts">
import { DescriptionsItemLabel } from '@/components/Descriptions'
import * as UserApi from '@/api/member/user'
const { user } = defineProps<{ user: UserApi.UserVO }>()
</script>
<style scoped lang="scss">
.cell-item {
  display: inline;
}

.cell-item::after {
  content: ':';
}
</style>
