<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">第 {{ receivablePlan.period }} 期</span>
          </el-row>
        </el-col>
      </div>
      <div>
        <!-- 右上：按钮 -->
        <slot></slot>
      </div>
    </div>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="vertical">
      <el-descriptions-item label="客户名称">
        {{ receivablePlan.customerName }}
      </el-descriptions-item>
      <el-descriptions-item label="合同编号">{{ receivablePlan.contractNo }}</el-descriptions-item>
      <el-descriptions-item label="计划回款金额">
        {{ erpPriceInputFormatter(receivablePlan.price) }}
      </el-descriptions-item>
      <el-descriptions-item label="计划回款日期">
        {{ formatDate(receivablePlan.returnTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="实际回款金额">
        <el-text v-if="receivablePlan.receivable">
          {{ erpPriceInputFormatter(receivablePlan.receivable.price) }}
        </el-text>
        <el-text v-else>{{ erpPriceInputFormatter(0) }}</el-text>
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'
import { formatDate } from '@/utils/formatTime'
import { erpPriceInputFormatter } from '@/utils'

const { receivablePlan } = defineProps<{ receivablePlan: ReceivablePlanApi.ReceivablePlanVO }>()
</script>
