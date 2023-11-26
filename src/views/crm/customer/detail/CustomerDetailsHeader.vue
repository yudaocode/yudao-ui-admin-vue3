<template>
  <div v-loading="loading">
    <div class="flex items-start justify-between">
      <div>
        <!-- 左上：客户基本信息 -->
        <CustomerBasicInfo :customer="customer" />
      </div>
      <div>
        <!-- 右上：按钮 -->
        <el-button v-hasPermi="['crm:customer:update']" @click="openForm(customer.id)">
          编辑
        </el-button>
        <el-button>更改成交状态</el-button>
      </div>
    </div>
    <el-row class="mt-10px">
      <el-button>
        <Icon class="mr-5px" icon="ph:calendar-fill" />
        创建任务
      </el-button>
      <el-button>
        <Icon class="mr-5px" icon="carbon:email" />
        发送邮件
      </el-button>
      <el-button>
        <Icon class="mr-5px" icon="system-uicons:contacts" />
        创建联系人
      </el-button>
      <el-button>
        <Icon class="mr-5px" icon="ep:opportunity" />
        创建商机
      </el-button>
      <el-button>
        <Icon class="mr-5px" icon="clarity:contract-line" />
        创建合同
      </el-button>
      <el-button>
        <Icon class="mr-5px" icon="icon-park:income-one" />
        创建回款
      </el-button>
      <el-button>
        <Icon class="mr-5px" icon="fluent:people-team-add-20-filled" />
        添加团队成员
      </el-button>
    </el-row>
  </div>
  <ContentWrap class="mt-10px">
    <el-descriptions :column="5" direction="vertical">
      <el-descriptions-item label="客户级别">
        <dict-tag :type="DICT_TYPE.CRM_CUSTOMER_LEVEL" :value="customer.level" />
      </el-descriptions-item>
      <el-descriptions-item label="成交状态">
        {{ customer.dealStatus ? '已成交' : '未成交' }}
      </el-descriptions-item>
      <el-descriptions-item label="负责人">
        {{ customer.ownerUserName }}
      </el-descriptions-item>
      <!-- TODO wanwan 首要联系人? -->
      <el-descriptions-item label="首要联系人" />
      <!-- TODO wanwan 首要联系人电话? -->
      <el-descriptions-item label="首要联系人电话">
        {{ customer.mobile }}
      </el-descriptions-item>
    </el-descriptions>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <CustomerForm ref="formRef" @success="emit('refresh')" />
</template>
<script setup lang="ts">
import * as CustomerApi from '@/api/crm/customer'
import { DICT_TYPE } from '@/utils/dict'
// TODO @wanwan：是不是把 CustomerBasicInfo 也放进来。
import CustomerBasicInfo from '@/views/crm/customer/detail/CustomerBasicInfo.vue'
import CustomerForm from '@/views/crm/customer/CustomerForm.vue'

const { customer, loading } = defineProps<{
  customer: CustomerApi.CustomerVO
  loading: boolean
}>()

/** 修改操作 */
const formRef = ref()
const openForm = (id?: number) => {
  formRef.value.open('update', id)
}

const emit = defineEmits(['refresh']) // 定义 success 事件，用于操作成功后的回调
</script>
