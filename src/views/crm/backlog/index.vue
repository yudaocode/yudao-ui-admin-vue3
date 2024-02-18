<template>
  <el-row :gutter="20">
    <el-col :span="4" class="min-w-[200px]">
      <div class="side-item-list">
        <div
          v-for="(item, index) in leftSides"
          :key="index"
          :class="leftType == item.infoType ? 'side-item-select' : 'side-item-default'"
          class="side-item"
          @click="sideClick(item)"
        >
          {{ item.name }}
          <el-badge v-if="item.msgCount > 0" :max="99" :value="item.msgCount" />
        </div>
      </div>
    </el-col>
    <el-col :span="20" :xs="24">
      <TodayCustomer v-if="leftType === 'todayCustomer'" />
      <FollowLeads v-if="leftType === 'followLeads'" />
      <CheckContract v-if="leftType === 'checkContract'" />
      <CheckReceivables v-if="leftType === 'checkReceivables'" />
      <EndContract v-if="leftType === 'endContract'" />
      <FollowCustomer v-if="leftType === 'followCustomer'" />
      <PutInPoolRemind v-if="leftType === 'putInPoolRemind'" />
      <RemindReceivables v-if="leftType === 'remindReceivables'" />
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import * as BacklogApi from '@/api/crm/backlog'
import CheckContract from './tables/CheckContract.vue'
import CheckReceivables from './tables/CheckReceivables.vue'
import EndContract from './tables/EndContract.vue'
import FollowCustomer from './tables/FollowCustomer.vue'
import FollowLeads from './tables/FollowLeads.vue'
import PutInPoolRemind from './tables/PutInPoolRemind.vue'
import RemindReceivables from './tables/RemindReceivables.vue'
import TodayCustomer from './tables/TodayCustomer.vue'

const leftType = ref('todayCustomer')

const todayCustomerCountRef = ref(0)
const followLeadsCountRef = ref(0)
const followCustomerCountRef = ref(0)
const putInPoolCustomerRemindCountRef = ref(0)
const checkContractCountRef = ref(0)
const checkReceivablesCountRef = ref(0)
const remindReceivablesCountRef = ref(0)
const endContractCountRef = ref(0)

const leftSides = ref([
  {
    name: '今日需联系客户',
    infoType: 'todayCustomer',
    msgCount: todayCustomerCountRef
  },
  {
    name: '分配给我的线索',
    infoType: 'followLeads',
    msgCount: followLeadsCountRef
  },
  {
    name: '分配给我的客户',
    infoType: 'followCustomer',
    msgCount: followCustomerCountRef
  },
  {
    name: '待进入公海的客户',
    infoType: 'putInPoolRemind',
    msgCount: putInPoolCustomerRemindCountRef
  },
  {
    name: '待审核合同',
    infoType: 'checkContract',
    msgCount: checkContractCountRef
  },
  {
    name: '待审核回款',
    infoType: 'checkReceivables',
    msgCount: checkReceivablesCountRef
  },
  {
    name: '待回款提醒',
    infoType: 'remindReceivables',
    msgCount: remindReceivablesCountRef
  },
  {
    name: '即将到期的合同',
    infoType: 'endContract',
    msgCount: endContractCountRef
  }
])

/** 侧边点击 */
const sideClick = (item: any) => {
  leftType.value = item.infoType
}

/** 加载时读取待办数量 */
onMounted(async () => {
  BacklogApi.getTodayCustomerCount().then(count => todayCustomerCountRef.value = count)
  BacklogApi.getFollowLeadsCount().then(count => followLeadsCountRef.value = count)
  BacklogApi.getFollowCustomerCount().then(count => followCustomerCountRef.value = count)
  BacklogApi.getPutInPoolCustomerRemindCount().then(count => putInPoolCustomerRemindCountRef.value = count)
  BacklogApi.getCheckContractCount().then(count => checkContractCountRef.value = count)
  BacklogApi.getCheckReceivablesCount().then(count => checkReceivablesCountRef.value = count)
  BacklogApi.getRemindReceivablePlanCount().then(count => remindReceivablesCountRef.value = count)
  BacklogApi.getEndContractCount().then(count => endContractCountRef.value = count)
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
