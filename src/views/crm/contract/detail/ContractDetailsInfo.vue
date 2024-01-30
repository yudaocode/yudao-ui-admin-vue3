<template>
  <ContentWrap>
    <el-collapse v-model="activeNames">
      <el-collapse-item name="contractInfo">
        <template #title>
          <span class="text-base font-bold">基本信息</span>
        </template>
        <!-- TODO puhui999: 先出详情样式后补全 -->
        <el-descriptions :column="4">
          <el-descriptions-item label="合同名称">
            {{ contract.name }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ contract.remark }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
      <el-collapse-item name="systemInfo">
        <template #title>
          <span class="text-base font-bold">系统信息</span>
        </template>
        <el-descriptions :column="2">
          <el-descriptions-item label="负责人">
            {{ contract.ownerUserName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建人">
            {{ contract.creatorName }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ contract.createTime ? formatDate(contract.createTime) : '空' }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ contract.updateTime ? formatDate(contract.updateTime) : '空' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-collapse-item>
    </el-collapse>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ContractApi from '@/api/crm/contract'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'ContractDetailsInfo' })
defineProps<{
  contract: ContractApi.ContractVO
}>()

// 展示的折叠面板
const activeNames = ref(['contractInfo', 'systemInfo'])
</script>
