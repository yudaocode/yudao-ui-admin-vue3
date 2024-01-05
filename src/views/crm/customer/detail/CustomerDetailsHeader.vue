<template>
  <div v-loading="loading">
    <div class="flex items-start justify-between">
      <div>
        <!-- 左上：客户基本信息 -->
        <el-col>
          <el-row>
            <span class="text-xl font-bold">{{ customer.name }}</span>
          </el-row>
        </el-col>
      </div>
      <div>
        <!-- 右上：按钮 -->
        <el-button
          type="primary"
          v-hasPermi="['crm:customer:update']"
          @click="openForm(customer.id)"
        >
          编辑
        </el-button>
        <!-- TODO @puhui999：转移的操作接入 -->
        <el-button type="primary" @click="transfer">转移</el-button>
        <!-- TODO @puhui999：修改成交状态的接入 -->
        <el-button>更改成交状态</el-button>
        <el-button v-if="customer.lockStatus" @click="handleUnlock(customer.id!)">解锁</el-button>
        <el-button v-else @click="handleLock(customer.id!)">锁定</el-button>
      </div>
    </div>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="vertical">
      <el-descriptions-item label="客户级别">
        <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="customer.level" />
      </el-descriptions-item>
      <el-descriptions-item label="成交状态">
        {{ customer.dealStatus ? '已成交' : '未成交' }}
      </el-descriptions-item>
      <el-descriptions-item label="负责人">{{ customer.ownerUserName }}</el-descriptions-item>
      <!-- TODO wanwan 首要联系人? -->
      <el-descriptions-item label="首要联系人" />
      <!-- TODO wanwan 首要联系人电话? -->
      <el-descriptions-item label="首要联系人电话">{{ customer.mobile }}</el-descriptions-item>
    </el-descriptions>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <CustomerForm ref="formRef" @success="emit('refresh')" />
</template>
<script lang="ts" setup>
import { DICT_TYPE } from '@/utils/dict'
import * as CustomerApi from '@/api/crm/customer'
import CustomerForm from '../CustomerForm.vue'

defineOptions({ name: 'CustomerDetailsHeader' })

const { customer, loading } = defineProps<{
  customer: CustomerApi.CustomerVO // 客户信息
  loading: boolean // 加载中
}>()
const message = useMessage() // 消息弹窗

/** 修改操作 */
const formRef = ref()
const openForm = (id?: number) => {
  formRef.value.open('update', id)
}

/** 锁定操作 */
const handleLock = async (id: number) => {
  await CustomerApi.lockCustomer(id, true)
  message.success('锁定成功')
  emit('refresh')
}

/** 解锁操作 */
const handleUnlock = async (id: number) => {
  console.log(customer, '=======')
  await CustomerApi.lockCustomer(id, false)
  message.success('解锁成功')
  emit('refresh')
}

const emit = defineEmits(['refresh']) // 定义 success 事件，用于操作成功后的回调
</script>
