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
        <el-button @click="openForm('update', contact.id)" v-hasPermi="['crm:contact:update']">
          编辑
        </el-button>
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
  <!-- 表单弹窗：添加/修改 -->
  <ContactForm ref="formRef" @success="emit('refresh')" />
</template>
<script setup lang="ts">
import * as ContactApi from '@/api/crm/contact'
import ContactForm from '@/views/crm/contact/ContactForm.vue'
import { formatDate } from '@/utils/formatTime'
//操作修改
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}
const { contact } = defineProps<{ contact: ContactApi.ContactVO }>()
const emit = defineEmits(['refresh']) // 定义 success 事件，用于操作成功后的回调
</script>
