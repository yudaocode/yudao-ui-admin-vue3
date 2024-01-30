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
      <el-form-item label="类型" prop="type">
        <el-select v-model="queryParams.type" placeholder="请选择类型" clearable class="!w-240px">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BI_ANALYZE_TYPE)"
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
          node-key="id"
          placeholder="请选择归属部门"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <el-col>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="合同金额排行" name="contractAmountRanking">
        <!-- 合同金额排行 -->
        <RankingContractStatistics :queryParams="queryParams" ref="rankingContractStatisticsRef" />
      </el-tab-pane>
      <el-tab-pane label="回款金额排行" name="receivablesRanKing" lazy>
        <!-- 回款金额排行 -->
        <RankingReceivablesStatistics
          :queryParams="queryParams"
          ref="rankingReceivablesStatisticsRef"
        />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>
<script lang="ts" setup>
import RankingContractStatistics from './components/RankingContractStatistics.vue'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

/** 排行榜 */
defineOptions({ name: 'RankingStatistics' })

const queryParams = reactive({
  type: 9, // 将 type 的初始值设置为 9 本年
  deptId: null
})
const queryFormRef = ref() // 搜索的表单
const deptList = ref<Tree[]>([]) // 树形结构
const activeTab = ref('contractAmountRanking')
const rankingContractStatisticsRef = ref() // RankingContractStatistics组件的引用
const rankingReceivablesStatisticsRef = ref() // RankingReceivablesStatistics组件的引用

/** 搜索按钮操作 */
const handleQuery = () => {
  if (activeTab.value === 'contractAmountRanking') {
    rankingContractStatisticsRef.value.reloadData()
  } else if (activeTab.value === 'receivablesRanKing') {
    rankingReceivablesStatisticsRef.value.reloadData()
  }
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}
// 加载部门树
onMounted(async () => {
  deptList.value = handleTree(await DeptApi.getSimpleDeptList())
})
</script>
<style lang="scss" scoped></style>
