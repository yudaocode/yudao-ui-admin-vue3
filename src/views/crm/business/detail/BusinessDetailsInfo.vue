<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-collapse-item name="basicInfo">
        <template #title>
          <span class="text-base font-bold">基本信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="商机姓名">{{ business.name }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ business.customerName }}</el-descriptions-item>
          <el-descriptions-item label="商机金额（元）">
            {{ erpPriceInputFormatter(business.totalPrice) }}
          </el-descriptions-item>
          <el-descriptions-item label="预计成交日期">
            {{ formatDate(business.dealTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="下次联系时间">
            {{ formatDate(business.contactNextTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="商机状态组">
            {{ business.statusTypeName }}
          </el-descriptions-item>
          <el-descriptions-item label="商机阶段">{{ business.statusName }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ business.remark }}</el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
      <el-collapse-item name="systemInfo">
        <template #title>
          <span class="text-base font-bold">系统信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="负责人">{{ business.ownerUserName }}</el-descriptions-item>
          <el-descriptions-item label="最后跟进时间">
            {{ formatDate(business.contactLastTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="">&nbsp;</el-descriptions-item>
          <el-descriptions-item label="">&nbsp;</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ business.creatorName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(business.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(business.updateTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>
<script setup lang="ts">
import * as BusinessApi from '@/api/crm/business'
import { formatDate } from '@/utils/formatTime'
import { erpPriceInputFormatter } from '@/utils'

const { business } = defineProps<{
  business: BusinessApi.BusinessVO
}>()

// 展示的折叠面板
const activeNames = ref(['basicInfo', 'systemInfo'])
</script>
