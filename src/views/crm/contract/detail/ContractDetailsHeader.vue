<!-- 合同详情头部组件-->
<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ contract.name }}</span>
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
      <el-descriptions-item label="客户名称">
        {{ contract.customerName }}
      </el-descriptions-item>
      <el-descriptions-item label="合同金额（元）">
        {{ erpPriceInputFormatter(contract.totalPrice) }}
      </el-descriptions-item>
      <el-descriptions-item label="下单时间">
        {{ formatDate(contract.orderDate) }}
      </el-descriptions-item>
      <el-descriptions-item label="回款金额（元）">
        {{ erpPriceInputFormatter(contract.totalReceivablePrice) }}
      </el-descriptions-item>
      <el-descriptions-item label="负责人">
        {{ contract.ownerUserName }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ContractApi from '@/api/crm/contract'
import { formatDate } from '@/utils/formatTime'
import { erpPriceInputFormatter } from '@/utils'

defineOptions({ name: 'ContractDetailsHeader' })
defineProps<{ contract: ContractApi.ContractVO }>()
</script>
