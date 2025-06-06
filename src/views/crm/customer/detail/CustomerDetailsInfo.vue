<template>
  <ContentWrap>
    <el-collapse v-model="activeNames" class="">
      <el-collapse-item name="basicInfo">
        <template #title>
          <span class="text-base font-bold">基本信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="客户名称">
            {{ customer.name }}
          </el-descriptions-item>
          <el-descriptions-item label="客户来源">
            <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="customer.source" />
          </el-descriptions-item>
          <el-descriptions-item label="手机">{{ customer.mobile }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ customer.telephone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ customer.email }}</el-descriptions-item>
          <el-descriptions-item label="地址">
            {{ customer.areaName }} {{ customer.detailAddress }}
          </el-descriptions-item>
          <el-descriptions-item label="QQ">{{ customer.qq }}</el-descriptions-item>
          <el-descriptions-item label="微信">{{ customer.wechat }}</el-descriptions-item>
          <el-descriptions-item label="客户行业">
            <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_INDUSTRY" :value="customer.industryId" />
          </el-descriptions-item>
          <el-descriptions-item label="客户级别">
            <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="customer.level" />
          </el-descriptions-item>
          <el-descriptions-item label="下次联系时间">
            {{ formatDate(customer.contactNextTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ customer.remark }}</el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
      <el-collapse-item name="systemInfo">
        <template #title>
          <span class="text-base font-bold">系统信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="负责人">{{ customer.ownerUserName }}</el-descriptions-item>
          <el-descriptions-item label="最后跟进记录">
            {{ customer.contactLastContent }}
          </el-descriptions-item>
          <el-descriptions-item label="最后跟进时间">
            {{ formatDate(customer.contactLastTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="">&nbsp;</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ customer.creatorName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(customer.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(customer.updateTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as CustomerApi from '@/api/crm/customer'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'CrmCustomerDetailsInfo' })
const { customer } = defineProps<{
  customer: CustomerApi.CustomerVO // 客户明细
}>()

const activeNames = ref(['basicInfo', 'systemInfo']) // 展示的折叠面板
</script>
<style lang="scss" scoped></style>
