<template>
  <doc-alert title="【通用】跟进记录、待办事项" url="https://doc.iocoder.cn/crm/follow-up/" />

  <el-row :gutter="20">
    <el-col :span="4" class="min-w-[200px]">
      <div class="side-item-list">
        <div
          v-for="(item, index) in leftSides"
          :key="index"
          :class="leftMenu == item.menu ? 'side-item-select' : 'side-item-default'"
          class="side-item"
          @click="sideClick(item)"
        >
          {{ item.name }}
          <el-badge v-if="item.count > 0" :max="99" :value="item.count" />
        </div>
      </div>
    </el-col>
    <el-col :span="20" :xs="24">
      <CustomerTodayContactList v-if="leftMenu === 'customerTodayContact'" />
      <ClueFollowList v-if="leftMenu === 'clueFollow'" />
      <ContractAuditList v-if="leftMenu === 'contractAudit'" />
      <ReceivableAuditList v-if="leftMenu === 'receivableAudit'" />
      <ContractRemindList v-if="leftMenu === 'contractRemind'" />
      <CustomerFollowList v-if="leftMenu === 'customerFollow'" />
      <CustomerPutPoolRemindList v-if="leftMenu === 'customerPutPoolRemind'" />
      <ReceivablePlanRemindList v-if="leftMenu === 'receivablePlanRemind'" />
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import CustomerFollowList from './components/CustomerFollowList.vue'
import CustomerTodayContactList from './components/CustomerTodayContactList.vue'
import CustomerPutPoolRemindList from './components/CustomerPutPoolRemindList.vue'
import ClueFollowList from './components/ClueFollowList.vue'
import ContractAuditList from './components/ContractAuditList.vue'
import ContractRemindList from './components/ContractRemindList.vue'
import ReceivablePlanRemindList from './components/ReceivablePlanRemindList.vue'
import ReceivableAuditList from './components/ReceivableAuditList.vue'
import * as CustomerApi from '@/api/crm/customer'
import * as ClueApi from '@/api/crm/clue'
import * as ContractApi from '@/api/crm/contract'
import * as ReceivableApi from '@/api/crm/receivable'
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'

defineOptions({ name: 'CrmBacklog' })

const leftMenu = ref('customerTodayContact')

const clueFollowCount = ref(0)
const customerFollowCount = ref(0)
const customerPutPoolRemindCount = ref(0)
const customerTodayContactCount = ref(0)
const contractAuditCount = ref(0)
const contractRemindCount = ref(0)
const receivableAuditCount = ref(0)
const receivablePlanRemindCount = ref(0)

const leftSides = ref([
  {
    name: '今日需联系客户',
    menu: 'customerTodayContact',
    count: customerTodayContactCount
  },
  {
    name: '分配给我的线索',
    menu: 'clueFollow',
    count: clueFollowCount
  },
  {
    name: '分配给我的客户',
    menu: 'customerFollow',
    count: customerFollowCount
  },
  {
    name: '待进入公海的客户',
    menu: 'customerPutPoolRemind',
    count: customerPutPoolRemindCount
  },
  {
    name: '待审核合同',
    menu: 'contractAudit',
    count: contractAuditCount
  },
  {
    name: '待审核回款',
    menu: 'receivableAudit',
    count: receivableAuditCount
  },
  {
    name: '待回款提醒',
    menu: 'receivablePlanRemind',
    count: receivablePlanRemindCount
  },
  {
    name: '即将到期的合同',
    menu: 'contractRemind',
    count: contractRemindCount
  }
])

/** 侧边点击 */
const sideClick = (item: any) => {
  leftMenu.value = item.menu
}

const getCount = () => {
  CustomerApi.getTodayContactCustomerCount().then(
    (count) => (customerTodayContactCount.value = count)
  )
  CustomerApi.getPutPoolRemindCustomerCount().then(
    (count) => (customerPutPoolRemindCount.value = count)
  )
  CustomerApi.getFollowCustomerCount().then((count) => (customerFollowCount.value = count))
  ClueApi.getFollowClueCount().then((count) => (clueFollowCount.value = count))
  ContractApi.getAuditContractCount().then((count) => (contractAuditCount.value = count))
  ContractApi.getRemindContractCount().then((count) => (contractRemindCount.value = count))
  ReceivableApi.getAuditReceivableCount().then((count) => (receivableAuditCount.value = count))
  ReceivablePlanApi.getReceivablePlanRemindCount().then(
    (count) => (receivablePlanRemindCount.value = count)
  )
}

/** 激活时 */
onActivated(async () => {
  getCount()
})

/** 初始化 */
onMounted(async () => {
  getCount()
})
</script>

<style lang="scss" scoped>
.side-item-list {
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  font-size: 14px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 5px;

  .side-item {
    position: relative;
    height: 50px;
    padding: 0 20px;
    line-height: 50px;
    cursor: pointer;
  }
}

.side-item-default {
  color: var(--el-text-color-primary);
  border-right: 2px solid transparent;
}

.side-item-select {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-right: 2px solid var(--el-color-primary);
}

.el-badge :deep(.el-badge__content) {
  top: 0;
  border: none;
}

.el-badge {
  position: absolute;
  top: 0;
  right: 15px;
}
</style>
