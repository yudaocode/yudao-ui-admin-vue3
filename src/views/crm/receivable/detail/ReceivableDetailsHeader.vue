<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ receivable.no }}</span>
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
        {{ receivable.customerName }}
      </el-descriptions-item>
      <el-descriptions-item label="合同金额">
        {{ erpPriceInputFormatter(receivable.contract?.totalPrice) }}
      </el-descriptions-item>
      <el-descriptions-item label="回款日期">
        {{ formatDate(receivable.returnTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="回款金额">
        {{ erpPriceInputFormatter(receivable.price) }}
      </el-descriptions-item>
      <el-descriptions-item label="负责人">
        {{ receivable.ownerUserName }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ReceivableApi from '@/api/crm/receivable'
import { formatDate } from '@/utils/formatTime'
import { erpPriceInputFormatter } from '@/utils'

const { receivable } = defineProps<{ receivable: ReceivableApi.ReceivableVO }>()
</script>
