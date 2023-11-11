<template>
  <!-- 列表 -->
  <ContentWrap>
    <el-tabs tab-position="left">
      <el-tab-pane label="拥有客户数限制">
        <CustomerQuantityLimit :confType="LimitConfType.CUSTOMER_QUANTITY_LIMIT" />
      </el-tab-pane>
      <el-tab-pane label="锁定客户数限制">
        <CustomerQuantityLimit :confType="LimitConfType.CUSTOMER_LOCK_LIMIT" />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script setup lang="ts">
import CustomerQuantityLimit from '@/views/crm/customerLimitConfig/CustomerQuantityLimit.vue'
import { LimitConfType } from '@/views/crm/customerLimitConfig/customerLimitConf'

defineOptions({ name: 'CrmCustomerLimitConfig' })
</script>
