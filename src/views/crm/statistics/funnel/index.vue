<!-- 数据统计 - 客户画像 -->
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
      <el-tab-pane label="销售漏斗分析" lazy name="funnelRef">
        <FunnelBusiness ref="funnelRef" :query-params="queryParams" />
      </el-tab-pane>
      <el-tab-pane label="新增商机分析" lazy name="businessSummaryRef">
        <BusinessSummary ref="businessSummaryRef" :query-params="queryParams" />
      </el-tab-pane>
      <el-tab-pane label="商机转化率分析" lazy name="businessInversionRateSummaryRef">
        <BusinessInversionRateSummary
          ref="businessInversionRateSummaryRef"
          :query-params="queryParams"
        />
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
import FunnelBusiness from './components/FunnelBusiness.vue'
import BusinessSummary from './components/BusinessSummary.vue'
import BusinessInversionRateSummary from './components/BusinessInversionRateSummary.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'CrmStatisticsFunnel' })

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

const activeTab = ref('funnelRef') // 活跃标签
const funnelRef = ref() // 销售漏斗
const businessSummaryRef = ref() // 新增商机分析
const businessInversionRateSummaryRef = ref() // 商机转化率分析

/** 搜索按钮操作 */
const handleQuery = () => {
  switch (activeTab.value) {
    case 'funnelRef':
      funnelRef.value?.loadData?.()
      break
    case 'businessSummaryRef':
      businessSummaryRef.value?.loadData?.()
      break
    case 'businessInversionRateSummaryRef':
      businessInversionRateSummaryRef.value?.loadData?.()
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
