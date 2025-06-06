<template>
  <div v-loading="loading">
    <div class="flex items-start justify-between">
      <div>
        <!-- 左上：客户基本信息 -->
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ customer.name }}</span>
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
      <el-descriptions-item label="客户级别">
        <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="customer.level" />
      </el-descriptions-item>
      <el-descriptions-item label="成交状态">
        {{ customer.dealStatus ? '已成交' : '未成交' }}
      </el-descriptions-item>
      <el-descriptions-item label="负责人">{{ customer.ownerUserName }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(customer.createTime) }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as CustomerApi from '@/api/crm/customer'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'CrmCustomerDetailsHeader' })
defineProps<{
  customer: CustomerApi.CustomerVO // 客户信息
  loading: boolean // 加载中
}>()
</script>
