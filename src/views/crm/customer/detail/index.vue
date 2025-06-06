<template>
  <CustomerDetailsHeader :customer="customer" :loading="loading">
    <el-button
      v-if="permissionListRef?.validateWrite"
      v-hasPermi="['crm:customer:update']"
      type="primary"
      @click="openForm"
    >
      编辑
    </el-button>
    <el-button v-if="permissionListRef?.validateOwnerUser" type="primary" @click="transfer">
      转移
    </el-button>
    <el-button v-if="permissionListRef?.validateWrite" @click="handleUpdateDealStatus">
      更改成交状态
    </el-button>
    <el-button
      v-if="customer.lockStatus && permissionListRef?.validateOwnerUser"
      @click="handleUnlock"
    >
      解锁
    </el-button>
    <el-button
      v-if="!customer.lockStatus && permissionListRef?.validateOwnerUser"
      @click="handleLock"
    >
      锁定
    </el-button>
    <el-button v-if="!customer.ownerUserId" type="primary" @click="handleReceive"> 领取</el-button>
    <el-button v-if="!customer.ownerUserId" type="primary" @click="handleDistributeForm">
      分配
    </el-button>
    <el-button
      v-if="customer.ownerUserId && permissionListRef?.validateOwnerUser"
      @click="handlePutPool"
    >
      放入公海
    </el-button>
  </CustomerDetailsHeader>
  <el-col>
    <el-tabs>
      <el-tab-pane label="跟进记录">
        <FollowUpList :biz-id="customerId" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="基本信息">
        <CustomerDetailsInfo :customer="customer" />
      </el-tab-pane>
      <el-tab-pane label="联系人" lazy>
        <ContactList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="团队成员">
        <PermissionList
          ref="permissionListRef"
          :biz-id="customer.id!"
          :biz-type="BizTypeEnum.CRM_CUSTOMER"
          :show-action="!permissionListRef?.isPool || false"
          @quit-team="close"
        />
      </el-tab-pane>
      <el-tab-pane label="商机" lazy>
        <BusinessList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="合同" lazy>
        <ContractList :biz-id="customer.id!" :biz-type="BizTypeEnum.CRM_CUSTOMER" />
      </el-tab-pane>
      <el-tab-pane label="回款" lazy>
        <ReceivablePlanList :customer-id="customer.id!" @create-receivable="createReceivable" />
        <ReceivableList ref="receivableListRef" :customer-id="customer.id!" />
      </el-tab-pane>
      <el-tab-pane label="操作日志">
        <OperateLogV2 :log-list="logList" />
      </el-tab-pane>
    </el-tabs>
  </el-col>

  <!-- 表单弹窗：添加/修改 -->
  <CustomerForm ref="formRef" @success="getCustomer" />
  <CustomerDistributeForm ref="distributeForm" @success="getCustomer" />
  <CrmTransferForm ref="transferFormRef" :biz-type="BizTypeEnum.CRM_CUSTOMER" @success="close" />
</template>
<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import * as CustomerApi from '@/api/crm/customer'
import CustomerForm from '@/views/crm/customer/CustomerForm.vue'
import CustomerDetailsInfo from './CustomerDetailsInfo.vue' // 客户明细 - 详细信息
import CustomerDetailsHeader from './CustomerDetailsHeader.vue' // 客户明细 - 头部
import ContactList from '@/views/crm/contact/components/ContactList.vue' // 联系人列表
import ContractList from '@/views/crm/contract/components/ContractList.vue' // 合同列表
import BusinessList from '@/views/crm/business/components/BusinessList.vue' // 商机列表
import ReceivableList from '@/views/crm/receivable/components/ReceivableList.vue' // 回款列表
import ReceivablePlanList from '@/views/crm/receivable/plan/components/ReceivablePlanList.vue' // 回款计划列表
import PermissionList from '@/views/crm/permission/components/PermissionList.vue' // 团队成员列表（权限）
import CrmTransferForm from '@/views/crm/permission/components/TransferForm.vue'
import FollowUpList from '@/views/crm/followup/index.vue'
import { BizTypeEnum } from '@/api/crm/permission'
import type { OperateLogVO } from '@/api/system/operatelog'
import { getOperateLogPage } from '@/api/crm/operateLog'
import CustomerDistributeForm from '@/views/crm/customer/pool/CustomerDistributeForm.vue'

defineOptions({ name: 'CrmCustomerDetail' })

const customerId = ref(0) // 客户编号
const loading = ref(true) // 加载中
const message = useMessage() // 消息弹窗
const { delView } = useTagsViewStore() // 视图操作
const { push, currentRoute } = useRouter() // 路由

const permissionListRef = ref<InstanceType<typeof PermissionList>>() // 团队成员列表 Ref

/** 获取详情 */
const customer = ref<CustomerApi.CustomerVO>({} as CustomerApi.CustomerVO) // 客户详情
const getCustomer = async () => {
  loading.value = true
  try {
    customer.value = await CustomerApi.getCustomer(customerId.value)
    await getOperateLog()
  } finally {
    loading.value = false
  }
}

/** 编辑客户 */
const formRef = ref<InstanceType<typeof CustomerForm>>() // 客户表单 Ref
const openForm = () => {
  formRef.value?.open('update', customerId.value)
}

/** 更新成交状态操作 */
const handleUpdateDealStatus = async () => {
  const dealStatus = !customer.value.dealStatus
  try {
    // 更新状态的二次确认
    await message.confirm(`确定更新成交状态为【${dealStatus ? '已成交' : '未成交'}】吗？`)
    // 发起更新
    await CustomerApi.updateCustomerDealStatus(customerId.value, dealStatus)
    message.success(`更新成交状态成功`)
    // 刷新数据
    await getCustomer()
  } catch {}
}

/** 客户转移 */
const transferFormRef = ref<InstanceType<typeof CrmTransferForm>>() // 客户转移表单 ref
const transfer = () => {
  transferFormRef.value?.open(customerId.value)
}

/** 锁定客户 */
const handleLock = async () => {
  await message.confirm(`确定锁定客户【${customer.value.name}】 吗？`)
  await CustomerApi.lockCustomer(unref(customerId.value), true)
  message.success(`锁定客户【${customer.value.name}】成功`)
  await getCustomer()
}

/** 解锁客户 */
const handleUnlock = async () => {
  await message.confirm(`确定解锁客户【${customer.value.name}】 吗？`)
  await CustomerApi.lockCustomer(unref(customerId.value), false)
  message.success(`解锁客户【${customer.value.name}】成功`)
  await getCustomer()
}

/** 领取客户 */
const handleReceive = async () => {
  await message.confirm(`确定领取客户【${customer.value.name}】 吗？`)
  await CustomerApi.receiveCustomer([unref(customerId.value)])
  message.success(`领取客户【${customer.value.name}】成功`)
  await getCustomer()
}

/** 分配客户 */
const distributeForm = ref<InstanceType<typeof CustomerDistributeForm>>() // 分配客户表单 Ref
const handleDistributeForm = async () => {
  distributeForm.value?.open(customerId.value)
}

/** 客户放入公海 */
const handlePutPool = async () => {
  await message.confirm(`确定将客户【${customer.value.name}】放入公海吗？`)
  await CustomerApi.putCustomerPool(unref(customerId.value))
  message.success(`客户【${customer.value.name}】放入公海成功`)
  // 加载
  close()
}

/** 获取操作日志 */
const logList = ref<OperateLogVO[]>([]) // 操作日志列表
const getOperateLog = async () => {
  if (!customerId.value) {
    return
  }
  const data = await getOperateLogPage({
    bizType: BizTypeEnum.CRM_CUSTOMER,
    bizId: customerId.value
  })
  logList.value = data.list
}

/** 从回款计划创建回款 */
const receivableListRef = ref<InstanceType<typeof ReceivableList>>() // 回款列表 Ref
const createReceivable = (planData: any) => {
  receivableListRef.value?.createReceivable(planData)
}

const close = () => {
  delView(unref(currentRoute))
  push({ name: 'CrmCustomer' })
}

/** 初始化 */
const { params } = useRoute()
onMounted(() => {
  if (!params.id) {
    message.warning('参数错误，客户不能为空！')
    close()
    return
  }
  customerId.value = params.id as unknown as number
  getCustomer()
})
</script>
