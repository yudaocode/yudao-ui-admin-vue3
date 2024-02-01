<!-- TODO @puhui999：这个组件的注释加下，方便大家打开就知道哈 -->
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
      <el-descriptions-item label="客户">
        {{ contract.customerName }}
      </el-descriptions-item>
      <el-descriptions-item label="客户签约人">
        {{ contract.contactName }}
      </el-descriptions-item>
      <el-descriptions-item label="合同金额">
        {{ contract.productPrice }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ contract.createTime ? formatDate(contract.createTime) : '空' }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ContractApi from '@/api/crm/contract'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'ContractDetailsHeader' })
defineProps<{ contract: ContractApi.ContractVO }>()
</script>
