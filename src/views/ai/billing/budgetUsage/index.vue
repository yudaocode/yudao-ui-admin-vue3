<template>
  <ContentWrap>
    <el-alert title="预算使用情况展示当前月度周期内各维度的预算消耗，数据来源于 DB（最终准绳）" type="info" :closable="false" class="mb-16px" />

    <!-- 租户级预算 -->
    <el-card shadow="never" class="mb-16px">
      <template #header><span class="font-bold">租户级预算（当月）</span></template>
      <div v-if="tenantUsage">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="预算金额">¥ {{ tenantUsage.budgetAmountYuan?.toFixed(2) || '未配置' }}</el-descriptions-item>
          <el-descriptions-item label="已用金额">¥ {{ tenantUsage.usedAmountYuan?.toFixed(4) || '0' }}</el-descriptions-item>
          <el-descriptions-item label="剩余金额">¥ {{ tenantUsage.remainAmountYuan?.toFixed(4) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="使用比例">
            <el-progress :percentage="tenantUsage.usagePercent || 0" :color="getProgressColor(tenantUsage.usagePercent)" />
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-empty v-else description="暂无数据" />
    </el-card>

    <!-- 查询指定用户 -->
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">用户级预算查询</span>
          <el-form :inline="true" class="-mb-15px">
            <el-form-item label="用户编号">
              <el-input v-model="userIdInput" placeholder="请输入用户编号" class="!w-180px" @keyup.enter="queryUserUsage" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="queryUserUsage"><Icon icon="ep:search" class="mr-5px" /> 查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>
      <div v-if="userUsage">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="用户编号">{{ userUsage.userId }}</el-descriptions-item>
          <el-descriptions-item label="预算金额">¥ {{ userUsage.budgetAmountYuan?.toFixed(2) || '未配置' }}</el-descriptions-item>
          <el-descriptions-item label="已用金额">¥ {{ userUsage.usedAmountYuan?.toFixed(4) || '0' }}</el-descriptions-item>
          <el-descriptions-item label="使用比例">
            <el-progress :percentage="userUsage.usagePercent || 0" :color="getProgressColor(userUsage.usagePercent)" />
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <el-empty v-else description="请输入用户编号查询" />
    </el-card>
  </ContentWrap>
</template>

<script setup lang="ts">
import { BudgetUsageApi, BudgetUsageVO } from '@/api/ai/billing/budgetUsage'

defineOptions({ name: 'AiBudgetUsage' })

const tenantUsage = ref<BudgetUsageVO>()
const userUsage = ref<BudgetUsageVO>()
const userIdInput = ref('')

const getProgressColor = (percent: number | undefined) => {
  if (!percent) return '#409eff'
  if (percent >= 100) return '#f56c6c'
  if (percent >= 90) return '#e6a23c'
  if (percent >= 80) return '#e6a23c'
  return '#409eff'
}

const queryTenantUsage = async () => {
  try {
    tenantUsage.value = await BudgetUsageApi.getBudgetUsage(0)
  } catch {
    tenantUsage.value = undefined
  }
}

const queryUserUsage = async () => {
  if (!userIdInput.value) return
  try {
    userUsage.value = await BudgetUsageApi.getBudgetUsage(Number(userIdInput.value))
  } catch {
    userUsage.value = undefined
  }
}

onMounted(() => {
  queryTenantUsage()
})
</script>
