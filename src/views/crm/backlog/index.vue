<template>
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
      <TodayCustomer v-if="leftMenu === 'todayCustomer'" />
      <ClueFollowList v-if="leftMenu === 'clueFollow'" />
      <CheckContract v-if="leftMenu === 'checkContract'" />
      <CheckReceivables v-if="leftMenu === 'checkReceivables'" />
      <EndContract v-if="leftMenu === 'endContract'" />
      <FollowCustomer v-if="leftMenu === 'followCustomer'" />
      <PutInPoolRemind v-if="leftMenu === 'putInPoolRemind'" />
      <RemindReceivables v-if="leftMenu === 'remindReceivables'" />
    </el-col>
  </el-row>
</template>

<script lang="ts" setup>
import * as BacklogApi from '@/api/crm/backlog'
import CheckContract from './tables/CheckContract.vue'
import CheckReceivables from './tables/CheckReceivables.vue'
import EndContract from './tables/EndContract.vue'
import FollowCustomer from './tables/FollowCustomer.vue'
import ClueFollowList from './components/ClueFollowList.vue'
import PutInPoolRemind from './tables/PutInPoolRemind.vue'
import RemindReceivables from './tables/RemindReceivables.vue'
import TodayCustomer from './tables/TodayCustomer.vue'
import * as ClueApi from '@/api/crm/clue'

defineOptions({ name: 'CrmBacklog' })

const leftMenu = ref('todayCustomer')

const todayCustomerCountRef = ref(0)
const clueFollowCount = ref(0)
const followCustomerCountRef = ref(0)
const putInPoolCustomerRemindCountRef = ref(0)
const checkContractCountRef = ref(0)
const checkReceivablesCountRef = ref(0)
const remindReceivablesCountRef = ref(0)
const endContractCountRef = ref(0)

const leftSides = ref([
  {
    name: '今日需联系客户',
    menu: 'todayCustomer',
    count: todayCustomerCountRef
  },
  {
    name: '分配给我的线索',
    menu: 'clueFollow',
    count: clueFollowCount
  },
  {
    name: '分配给我的客户',
    menu: 'followCustomer',
    count: followCustomerCountRef
  },
  {
    name: '待进入公海的客户',
    menu: 'putInPoolRemind',
    count: putInPoolCustomerRemindCountRef
  },
  {
    name: '待审核合同',
    menu: 'checkContract',
    count: checkContractCountRef
  },
  {
    name: '待审核回款',
    menu: 'checkReceivables',
    count: checkReceivablesCountRef
  },
  {
    name: '待回款提醒',
    menu: 'remindReceivables',
    count: remindReceivablesCountRef
  },
  {
    name: '即将到期的合同',
    menu: 'endContract',
    count: endContractCountRef
  }
])

/** 侧边点击 */
const sideClick = (item: any) => {
  leftMenu.value = item.menu
}

const getCount = () => {
  BacklogApi.getTodayCustomerCount().then((count) => (todayCustomerCountRef.value = count))
  ClueApi.getFollowClueCount().then((count) => (clueFollowCount.value = count))
  BacklogApi.getClueFollowListCount().then((count) => (clueFollowCount.value = count))
  BacklogApi.getFollowCustomerCount().then((count) => (followCustomerCountRef.value = count))
  BacklogApi.getPutInPoolCustomerRemindCount().then(
    (count) => (putInPoolCustomerRemindCountRef.value = count)
  )
  BacklogApi.getCheckContractCount().then((count) => (checkContractCountRef.value = count))
  BacklogApi.getCheckReceivablesCount().then((count) => (checkReceivablesCountRef.value = count))
  BacklogApi.getRemindReceivablePlanCount().then(
    (count) => (remindReceivablesCountRef.value = count)
  )
  BacklogApi.getEndContractCount().then((count) => (endContractCountRef.value = count))
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
