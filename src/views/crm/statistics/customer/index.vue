<!-- 数据统计 - 员工客户分析 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="时间范围" prop="orderDate">
        <el-date-picker
          v-model="queryParams.times"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          :shortcuts="defaultShortcuts"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
          @change="handleQuery"
        />
      </el-form-item>
      <el-form-item label="时间间隔" prop="interval">
        <el-select
          v-model="queryParams.interval"
          class="!w-240px"
          placeholder="间隔类型"
          @change="handleQuery"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.DATE_INTERVAL)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="归属部门" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptList"
          :props="defaultProps"
          check-strictly
          class="!w-240px"
          node-key="id"
          placeholder="请选择归属部门"
          @change="(queryParams.userId = undefined), handleQuery()"
        />
      </el-form-item>
      <el-form-item label="员工" prop="userId">
        <el-select
          v-model="queryParams.userId"
          class="!w-240px"
          clearable
          placeholder="员工"
          @change="handleQuery"
        >
          <el-option
            v-for="(user, index) in userListByDeptId"
            :key="index"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          查询
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 客户统计 -->
  <el-col>
    <el-tabs v-model="activeTab">
      <!-- 客户总量分析 -->
      <el-tab-pane label="客户总量分析" lazy name="customerSummary">
        <CustomerSummary ref="customerSummaryRef" :query-params="queryParams" />
      </el-tab-pane>
      <!-- 客户跟进次数分析 -->
      <el-tab-pane label="客户跟进次数分析" lazy name="followUpSummary">
        <CustomerFollowUpSummary ref="followUpSummaryRef" :query-params="queryParams" />
      </el-tab-pane>
      <!-- 客户跟进方式分析 -->
      <el-tab-pane label="客户跟进方式分析" lazy name="followUpType">
        <CustomerFollowUpType ref="followUpTypeRef" :query-params="queryParams" />
      </el-tab-pane>
      <!-- 客户转化率分析 -->
      <el-tab-pane label="客户转化率分析" lazy name="conversionStat">
        <CustomerConversionStat ref="conversionStatRef" :query-params="queryParams" />
      </el-tab-pane>
      <!-- 公海客户分析 -->
      <el-tab-pane label="公海客户分析" lazy name="poolSummary">
        <CustomerPoolSummary ref="customerPoolSummaryRef" :query-params="queryParams" />
      </el-tab-pane>
      <!-- 成交周期分析 -->
      <el-tab-pane label="员工客户成交周期分析" lazy name="dealCycleByUser">
        <CustomerDealCycleByUser ref="dealCycleByUserRef" :query-params="queryParams" />
      </el-tab-pane>
      <el-tab-pane label="地区客户成交周期分析" lazy name="dealCycleByArea">
        <CustomerDealCycleByArea ref="dealCycleByAreaRef" :query-params="queryParams" />
      </el-tab-pane>
      <el-tab-pane label="产品客户成交周期分析" lazy name="dealCycleByProduct">
        <CustomerDealCycleByProduct ref="dealCycleByProductRef" :query-params="queryParams" />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>

<script lang="ts" setup>
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { useUserStore } from '@/store/modules/user'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { beginOfDay, defaultShortcuts, endOfDay, formatDate } from '@/utils/formatTime'
import { defaultProps, handleTree } from '@/utils/tree'
import CustomerConversionStat from './components/CustomerConversionStat.vue'
import CustomerDealCycleByUser from './components/CustomerDealCycleByUser.vue'
import CustomerDealCycleByArea from './components/CustomerDealCycleByArea.vue'
import CustomerDealCycleByProduct from './components/CustomerDealCycleByProduct.vue'
import CustomerFollowUpSummary from './components/CustomerFollowUpSummary.vue'
import CustomerFollowUpType from './components/CustomerFollowUpType.vue'
import CustomerSummary from './components/CustomerSummary.vue'
import CustomerPoolSummary from './components/CustomerPoolSummary.vue'

defineOptions({ name: 'CrmStatisticsCustomer' })

const queryParams = reactive({
  interval: 2, // WEEK, 周
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

/** 根据选择的部门筛选员工清单 */
const userListByDeptId = computed(() =>
  queryParams.deptId
    ? userList.value.filter((u: UserApi.UserVO) => u.deptId === queryParams.deptId)
    : []
)

const activeTab = ref('customerSummary') // 活跃标签
const customerSummaryRef = ref() // 1. 客户总量分析
const followUpSummaryRef = ref() // 2. 客户跟进次数分析
const followUpTypeRef = ref() // 3. 客户跟进方式分析
const conversionStatRef = ref() // 4. 客户转化率分析
const customerPoolSummaryRef = ref() // 5. 客户公海分析
const dealCycleByUserRef = ref() // 6. 成交周期分析(按员工)
const dealCycleByAreaRef = ref() // 7. 成交周期分析(按地区)
const dealCycleByProductRef = ref() // 8. 成交周期分析(按产品)

/** 搜索按钮操作 */
const handleQuery = () => {
  switch (activeTab.value) {
    case 'customerSummary': // 客户总量分析
      customerSummaryRef.value?.loadData?.()
      break
    case 'followUpSummary': // 客户跟进次数分析
      followUpSummaryRef.value?.loadData?.()
      break
    case 'followUpType': // 客户跟进方式分析
      followUpTypeRef.value?.loadData?.()
      break
    case 'conversionStat': // 客户转化率分析
      conversionStatRef.value?.loadData?.()
      break
    case 'poolSummary': // 公海客户分析
      customerPoolSummaryRef.value?.loadData?.()
      break
    case 'dealCycleByUser': // 成交周期分析
      dealCycleByUserRef.value?.loadData?.()
      break
    case 'dealCycleByArea': // 成交周期分析
      dealCycleByAreaRef.value?.loadData?.()
      break
    case 'dealCycleByProduct': // 成交周期分析
      dealCycleByProductRef.value?.loadData?.()
      break
  }
}

/** 当 activeTab 改变时，刷新当前活动的 tab */
watch(activeTab, () => {
  handleQuery()
})

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 初始化 */
onMounted(async () => {
  deptList.value = handleTree(await DeptApi.getSimpleDeptList())
  userList.value = handleTree(await UserApi.getSimpleUserList())
})
</script>
