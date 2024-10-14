<!-- 合同详情组件 -->
<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-collapse-item name="contractInfo">
        <template #title>
          <span class="text-base font-bold">基本信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="合同编号">{{ contract.no }}</el-descriptions-item>
          <el-descriptions-item label="合同名称">{{ contract.name }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ contract.customerName }}</el-descriptions-item>
          <el-descriptions-item label="商机名称">{{ contract.businessName }}</el-descriptions-item>
          <el-descriptions-item label="合同金额（元）">
            {{ erpPriceInputFormatter(contract.totalPrice) }}
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">
            {{ formatDate(contract.orderDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="合同开始时间">
            {{ formatDate(contract.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="合同结束时间">
            {{ formatDate(contract.endTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="客户签约人">
            {{ contract.signContactName }}
          </el-descriptions-item>
          <el-descriptions-item label="公司签约人">
            {{ contract.signUserName }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ contract.remark }}
          </el-descriptions-item>
          <el-descriptions-item label="合同状态">
            <dict-tag :type="DICT_TYPE.CRM_AUDIT_STATUS" :value="contract.auditStatus" />
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
      <el-collapse-item name="systemInfo">
        <template #title>
          <span class="text-base font-bold">系统信息</span>
        </template>
        <el-descriptions :column="4">
          <el-descriptions-item label="负责人">{{ contract.ownerUserName }}</el-descriptions-item>
          <el-descriptions-item label="最后跟进时间">
            {{ formatDate(contract.contactLastTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="">&nbsp;</el-descriptions-item>
          <el-descriptions-item label="">&nbsp;</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ contract.creatorName }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(contract.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(contract.updateTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ContractApi from '@/api/crm/contract'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { erpPriceInputFormatter } from '@/utils'

defineOptions({ name: 'ContractDetailsInfo' })
defineProps<{
  contract: ContractApi.ContractVO
}>()

// 展示的折叠面板
const activeNames = ref(['contractInfo', 'systemInfo'])
</script>
