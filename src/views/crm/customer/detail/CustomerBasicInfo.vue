<template>
  <el-col> 客户 </el-col>
  <el-col>
    <el-row>
      <span class="text-xl font-bold">{{ customer.name }}</span>
    </el-row>
  </el-col>
  <el-col class="mt-10px">
    <Icon icon="ant-design:tag-filled" />
    <!-- TODO 标签 -->
  </el-col>
</template>
<script setup lang="ts">
import * as CustomerApi from '@/api/crm/customer'

const { customer } = defineProps<{ customer: CustomerApi.CustomerVO }>()
</script>
<style scoped lang="scss"></style>
