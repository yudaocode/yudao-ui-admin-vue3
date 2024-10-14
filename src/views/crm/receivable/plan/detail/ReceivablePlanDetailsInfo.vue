<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-collapse-item name="basicInfo">
        <template #title>
          <span class="text-base font-bold">基本信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="期数">{{ receivablePlan.period }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">
            {{ receivablePlan.customerName }}
          </el-descriptions-item>
          <el-descriptions-item label="合同编号">
            {{ receivablePlan.contractNo }}
          </el-descriptions-item>
          <el-descriptions-item label="计划回款金额">
            {{ erpPriceInputFormatter(receivablePlan.price) }}
          </el-descriptions-item>
          <el-descriptions-item label="计划回款日期">
            {{ formatDate(receivablePlan.returnTime, 'YYYY-MM-DD') }}
          </el-descriptions-item>
          <el-descriptions-item label="计划回款方式">
            <dict-tag
              :type="DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE"
              :value="receivablePlan.returnType"
            />
          </el-descriptions-item>
          <el-descriptions-item label="提前几天提醒">
            {{ receivablePlan.remindDays }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ receivablePlan.remark }}</el-descriptions-item>
          <el-descriptions-item label="实际回款金额">
            <el-text v-if="receivablePlan.receivable">
              {{ erpPriceInputFormatter(receivablePlan.receivable.price) }}
            </el-text>
            <el-text v-else>{{ erpPriceInputFormatter(0) }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="未回款金额">
            <el-text v-if="receivablePlan.receivable">
              {{ erpPriceInputFormatter(receivablePlan.price - receivablePlan.receivable.price) }}
            </el-text>
            <el-text v-else>{{ erpPriceInputFormatter(receivablePlan.price) }}</el-text>
          </el-descriptions-item>
          <el-descriptions-item label="实际回款日期">
            {{ formatDate(receivablePlan.receivable?.returnTime, 'YYYY-MM-DD') }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
      <el-collapse-item name="systemInfo">
        <template #title>
          <span class="text-base font-bold">系统信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="负责人">
            {{ receivablePlan.ownerUserName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ receivablePlan.creatorName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(receivablePlan.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(receivablePlan.updateTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>
<script setup lang="ts">
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { erpPriceInputFormatter } from '@/utils'

const { receivablePlan } = defineProps<{
  receivablePlan: ReceivablePlanApi.ReceivablePlanVO
}>()

// 展示的折叠面板
const activeNames = ref(['basicInfo', 'systemInfo'])
</script>
