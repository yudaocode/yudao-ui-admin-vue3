<template>
  <div>
    <div class="flex items-start justify-between">
      <div>
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ contact.name }}</span>
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
        {{ contact.customerName }}
      </el-descriptions-item>
      <el-descriptions-item label="职务">
        {{ contact.post }}
      </el-descriptions-item>
      <el-descriptions-item label="手机">
        {{ contact.mobile }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ contact.createTime ? formatDate(contact.createTime) : '空' }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ContactApi from '@/api/crm/contact'
import { formatDate } from '@/utils/formatTime'

const { contact } = defineProps<{ contact: ContactApi.ContactVO }>()
</script>
