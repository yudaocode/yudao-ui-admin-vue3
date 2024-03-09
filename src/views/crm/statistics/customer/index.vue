<!-- 数据统计 - 员工客户分析 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="时间范围" prop="orderDate">
        <el-date-picker
          v-model="queryParams.times"
          :shortcuts="defaultShortcuts"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
        />
      </el-form-item>
      <el-form-item label="归属部门" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          class="!w-240px"
          :data="deptList"
          :props="defaultProps"
          check-strictly
          node-key="id"
          placeholder="请选择归属部门"
          @change="queryParams.userId = undefined"
        />
      </el-form-item>
      <el-form-item label="员工" prop="userId">
        <el-select v-model="queryParams.userId" class="!w-240px" placeholder="员工" clearable>
          <el-option
            v-for="(user, index) in userListByDeptId"
            :label="user.nickname"
            :value="user.id"
            :key="index"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"> <Icon icon="ep:search" class="mr-5px" /> 搜索 </el-button>
        <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-5px" /> 重置 </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 客户统计 -->
  <el-col>
    <el-tabs v-model="activeTab">
      <!-- 客户总量分析 -->
      <el-tab-pane label="客户总量分析" name="customerSummary" lazy>
        <CustomerSummary :query-params="queryParams" ref="customerSummaryRef" />
      </el-tab-pane>
      <!-- 客户跟进次数分析 -->
      <el-tab-pane label="客户跟进次数分析" name="followupSummary" lazy>
        <CustomerFollowupSummary :query-params="queryParams" ref="followupSummaryRef" />
      </el-tab-pane>
      <!-- 客户跟进方式分析 -->
      <el-tab-pane label="客户跟进方式分析" name="followupType" lazy>
        <CustomerFollowupType :query-params="queryParams" ref="followupTypeRef" />
      </el-tab-pane>
      <!-- 客户转化率分析 -->
      <el-tab-pane label="客户转化率分析" name="conversionStat" lazy>
        <CustomerConversionStat :query-params="queryParams" ref="conversionStatRef" />
      </el-tab-pane>
      <!-- 成交周期分析 -->
      <el-tab-pane label="成交周期分析" name="dealCycle" lazy>
        <CustomerDealCycle :query-params="queryParams" ref="dealCycleRef" />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>

<script lang="ts" setup>
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { useUserStore } from '@/store/modules/user'
import { beginOfDay, defaultShortcuts, endOfDay, formatDate } from '@/utils/formatTime'
import { defaultProps, handleTree } from '@/utils/tree'
import CustomerSummary from './components/CustomerSummary.vue'
import CustomerFollowupSummary from './components/CustomerFollowupSummary.vue'
import CustomerFollowupType from './components/CustomerFollowupType.vue'
import CustomerConversionStat from './components/CustomerConversionStat.vue'
import CustomerDealCycle from './components/CustomerDealCycle.vue'

defineOptions({ name: 'CrmStatisticsCustomer' })

const queryParams = reactive({
  deptId: useUserStore().getUser.deptId,
  userId: undefined,
  times: [
    // 默认显示最近一周的数据
    formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7))),
    formatDate(endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24)))
  ]
})

const queryFormRef = ref() // 搜索的表单
const deptList = ref<Tree[]>([]) // 部门树形结构
const userList = ref<UserApi.UserVO[]>([]) // 全量用户清单
// 根据选择的部门筛选员工清单
const userListByDeptId = computed(() =>
  queryParams.deptId
    ? userList.value.filter((u: UserApi.UserVO) => u.deptId === queryParams.deptId)
    : []
)

// 活跃标签
const activeTab = ref('customerSummary')
// 1.客户总量分析
const customerSummaryRef = ref()
// 2.客户跟进次数分析
const followupSummaryRef = ref()
// 3.客户跟进方式分析
const followupTypeRef = ref()
// 4.客户转化率分析
const conversionStatRef = ref()
// 5.公海客户分析
// 缺 crm_owner_record 表
// 6.成交周期分析
const dealCycleRef = ref()

/** 搜索按钮操作 */
const handleQuery = () => {
  switch (activeTab.value) {
    case 'customerSummary':
      customerSummaryRef.value?.loadData?.()
      break
    case 'followupSummary':
      followupSummaryRef.value?.loadData?.()
      break
    case 'followupType':
      followupTypeRef.value?.loadData?.()
      break
    case 'conversionStat':
      conversionStatRef.value?.loadData?.()
      break
    case 'dealCycle':
      dealCycleRef.value?.loadData?.()
      break
  }
}

// 当 activeTab 改变时，刷新当前活动的 tab
watch(activeTab, () => {
  handleQuery()
})

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

// 加载部门树
onMounted(async () => {
  deptList.value = handleTree(await DeptApi.getSimpleDeptList())
  userList.value = handleTree(await UserApi.getSimpleUserList())
})
</script>
