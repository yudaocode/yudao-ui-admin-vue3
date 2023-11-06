<template>
  <el-collapse v-model="activeNames">
    <el-collapse-item name="basicInfo">
      <template #title>
        <span class="text-base font-bold">基本信息</span>
      </template>
      <el-descriptions :column="4">
        <el-descriptions-item label="客户名称">
          {{ customer.name }}
        </el-descriptions-item>
        <el-descriptions-item label="所属行业">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_INDUSTRY" :value="customer.industryId" />
        </el-descriptions-item>
        <el-descriptions-item label="客户来源">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_SOURCE" :value="customer.source" />
        </el-descriptions-item>
        <el-descriptions-item label="客户等级">
          <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="customer.level" />
        </el-descriptions-item>
        <el-descriptions-item label="手机">
          {{ customer.mobile }}
        </el-descriptions-item>
        <el-descriptions-item label="电话">
          {{ customer.telephone }}
        </el-descriptions-item>
        <el-descriptions-item label="邮箱">
          {{ customer.email }}
        </el-descriptions-item>
        <el-descriptions-item label="QQ">
          {{ customer.qq }}
        </el-descriptions-item>
        <el-descriptions-item label="微信">
          {{ customer.wechat }}
        </el-descriptions-item>
        <el-descriptions-item label="网址">
          {{ customer.website }}
        </el-descriptions-item>
        <el-descriptions-item label="所在地">
          {{ customer.areaName }}
        </el-descriptions-item>
        <el-descriptions-item label="详细地址">
          {{ customer.detailAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="下次联系时间">
          {{ customer.contactNextTime ? formatDate(customer.contactNextTime, 'YYYY-MM-DD') : '空' }}
        </el-descriptions-item>
      </el-descriptions>
      <el-descriptions :column="1">
        <el-descriptions-item label="客户描述">
          {{ customer.description }}
        </el-descriptions-item>
        <el-descriptions-item label="备注">
          {{ customer.remark }}
        </el-descriptions-item>
      </el-descriptions>
    </el-collapse-item>
    <el-collapse-item name="systemInfo">
      <template #title>
        <span class="text-base font-bold">系统信息</span>
      </template>
      <el-descriptions :column="2">
        <el-descriptions-item label="负责人">
          {{ customer.ownerUserName }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ customer.creatorName }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ customer.createTime ? formatDate(customer.createTime) : '空' }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ customer.updateTime ? formatDate(customer.updateTime) : '空' }}
        </el-descriptions-item>
        <!-- TODO wanwan：要不把“最后跟进时间”放到“下次联系时间”后面 -->
        <el-descriptions-item label="最后跟进时间">
          {{ customer.contactLastTime ? formatDate(customer.contactLastTime) : '空' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-collapse-item>
  </el-collapse>
</template>
<script setup lang="ts">
import * as CustomerApi from '@/api/crm/customer'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'

const { customer } = defineProps<{ customer: CustomerApi.CustomerVO }>()

// 展示的折叠面板
const activeNames = ref(['basicInfo', 'systemInfo'])
</script>
<style scoped lang="scss"></style>
