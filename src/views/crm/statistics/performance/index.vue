<!-- 数据统计 - 员工业绩分析 -->
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
      <el-form-item label="选择年份" prop="orderDate">
        <el-date-picker
          v-model="queryParams.times[0]"
          class="!w-240px"
          type="year"
          value-format="YYYY"
          :default-time="[new Date().getFullYear()]"
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

  <!-- 员工业绩统计 -->
  <el-col>
    <el-tabs v-model="activeTab">
      <!-- 员工合同统计 -->
      <el-tab-pane label="员工合同数量统计" name="ContractCountPerformance" lazy>
        <ContractCountPerformance :query-params="queryParams" ref="ContractCountPerformanceRef" />
      </el-tab-pane>
      <!-- 员工合同金额统计 -->
      <el-tab-pane label="员工合同金额统计" name="ContractPricePerformance" lazy>
        <ContractPricePerformance :query-params="queryParams" ref="ContractPricePerformanceRef" />
      </el-tab-pane>
      <!-- 员工回款金额统计 -->
      <el-tab-pane label="员工回款金额统计" name="ReceivablePricePerformance" lazy>
        <ReceivablePricePerformance
          :query-params="queryParams"
          ref="ReceivablePricePerformanceRef"
        />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>

<script lang="ts" setup>
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { useUserStore } from '@/store/modules/user'
import { beginOfDay, formatDate } from '@/utils/formatTime'
import { defaultProps, handleTree } from '@/utils/tree'
import ContractCountPerformance from './components/ContractCountPerformance.vue'
import ContractPricePerformance from './components/ContractPricePerformance.vue'
import ReceivablePricePerformance from './components/ReceivablePricePerformance.vue'

defineOptions({ name: 'CrmStatisticsCustomer' })

const queryParams = reactive({
  deptId: useUserStore().getUser.deptId,
  userId: undefined,
  times: [
    // 默认显示当年的数据
    formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7)))
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

// TODO @scholar：改成尾注释，保证 vue 内容短一点；变量名小写
// 活跃标签
const activeTab = ref('ContractCountPerformance')
// 1.员工合同数量统计
const ContractCountPerformanceRef = ref()
// 2.员工合同金额统计
const ContractPricePerformanceRef = ref()
// 3.员工回款金额统计
const ReceivablePricePerformanceRef = ref()

/** 搜索按钮操作 */
const handleQuery = () => {
  // 从 queryParams.times[0] 中获取到了年份
  const selectYear = parseInt(queryParams.times[0])

  // 创建一个新的 Date 对象，设置为指定的年份的第一天
  const fullDate = new Date(selectYear, 0, 1, 0, 0, 0)

  // 将完整的日期时间格式化为需要的字符串形式，比如 2004-01-01 00:00:00
  // TODO @scholar：看看，是不是可以使用 year 哈
  queryParams.times[0] = `${fullDate.getFullYear()}-${String(fullDate.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(fullDate.getDate()).padStart(2, '0')} ${String(fullDate.getHours()).padStart(2, '0')}:${String(fullDate.getMinutes()).padStart(2, '0')}:${String(fullDate.getSeconds()).padStart(2, '0')}`

  switch (activeTab.value) {
    case 'ContractCountPerformance':
      ContractCountPerformanceRef.value?.loadData?.()
      break
    case 'ContractPricePerformance':
      ContractPricePerformanceRef.value?.loadData?.()
      break
    case 'ReceivablePricePerformance':
      ReceivablePricePerformanceRef.value?.loadData?.()
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
