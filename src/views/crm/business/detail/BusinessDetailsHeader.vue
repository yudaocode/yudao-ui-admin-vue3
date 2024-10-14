<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ business.name }}</span>
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
      <el-descriptions-item label="客户名称">{{ business.customerName }}</el-descriptions-item>
      <el-descriptions-item label="商机金额（元）">
        {{ erpPriceInputFormatter(business.totalPrice) }}
      </el-descriptions-item>
      <el-descriptions-item label="商机组">{{ business.statusTypeName }}</el-descriptions-item>
      <el-descriptions-item label="负责人">{{ business.ownerUserName }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(business.createTime) }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as BusinessApi from '@/api/crm/business'
import { formatDate } from '@/utils/formatTime'
import { erpPriceInputFormatter } from '@/utils'

const { business } = defineProps<{ business: BusinessApi.BusinessVO }>()
</script>
