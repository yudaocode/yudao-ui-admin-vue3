<template>
  <!-- 列表 -->
  <ContentWrap>
    <el-tabs>
      <el-tab-pane label="拥有客户数限制">
        <CustomerLimitConfigList :confType="LimitConfType.CUSTOMER_QUANTITY_LIMIT" />
      </el-tab-pane>
      <el-tab-pane label="锁定客户数限制">
        <CustomerLimitConfigList :confType="LimitConfType.CUSTOMER_LOCK_LIMIT" />
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>
<script setup lang="ts">
import CustomerLimitConfigList from './CustomerLimitConfigList.vue'
import { LimitConfType } from '@/api/crm/customer/limitConfig'

defineOptions({ name: 'CrmCustomerLimitConfig' })
</script>
