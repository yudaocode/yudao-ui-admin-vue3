<!-- BI 排行版 -->
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

  <!-- 排行数据 -->
  <el-col>
    <el-tabs v-model="activeTab">
      <!-- 合同金额排行 -->
      <el-tab-pane label="合同金额排行" name="contractPriceRank" lazy>
        <ContractPriceRank :query-params="queryParams" ref="contractPriceRankRef" />
      </el-tab-pane>
      <!-- 回款金额排行 -->
      <el-tab-pane label="回款金额排行" name="receivablePriceRank" lazy>
        <ReceivablePriceRank :query-params="queryParams" ref="receivablePriceRankRef" />
      </el-tab-pane>
      <!-- 签约合同排行 -->
      <el-tab-pane label="签约合同排行" name="contractCountRank" lazy>
        <ContractCountRank :query-params="queryParams" ref="contractCountRankRef" />
      </el-tab-pane>
      <!-- 产品销量排行 -->
      <el-tab-pane label="产品销量排行" name="productSalesRank" lazy>
        <ProductSalesRank :query-params="queryParams" ref="productSalesRankRef" />
      </el-tab-pane>
      <!-- 新增客户数排行 -->
      <el-tab-pane label="新增客户数排行" name="customerCountRank" lazy>
        <CustomerCountRank :query-params="queryParams" ref="customerCountRankRef" />
      </el-tab-pane>
      <!-- 新增联系人数排行 -->
      <el-tab-pane label="新增联系人数排行" name="contactsCountRank" lazy>
        <ContactsCountRank :query-params="queryParams" ref="contactsCountRankRef" />
      </el-tab-pane>
      <!-- 跟进次数排行 -->
      <el-tab-pane label="跟进次数排行" name="followCountRank" lazy>
        <FollowCountRank :query-params="queryParams" ref="followCountRankRef" />
      </el-tab-pane>
      <!-- 跟进客户数排行 -->
      <el-tab-pane label="跟进客户数排行" name="followCustomerCountRank" lazy>
        <FollowCustomerCountRank :query-params="queryParams" ref="followCustomerCountRankRef" />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>
<script lang="ts" setup>
import ContractPriceRank from './ContractPriceRank.vue'
import ReceivablePriceRank from './ReceivablePriceRank.vue'
import ContractCountRank from './ContractCountRank.vue'
import ProductSalesRank from './ProductSalesRank.vue'
import CustomerCountRank from './CustomerCountRank.vue'
import ContactsCountRank from './ContactsCountRank.vue'
import FollowCountRank from './FollowCountRank.vue'
import FollowCustomerCountRank from './FollowCustomerCountRank.vue'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import { beginOfDay, defaultShortcuts, endOfDay, formatDate } from '@/utils/formatTime'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'CrmBiRank' })

const queryParams = reactive({
  deptId: useUserStore().getUser.deptId,
  times: [
    // 默认显示最近一周的数据
    formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7))),
    formatDate(endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24)))
  ]
})

const queryFormRef = ref() // 搜索的表单
const deptList = ref<Tree[]>([]) // 树形结构
const activeTab = ref('contractPriceRank')
const contractPriceRankRef = ref() // ContractPriceRank 组件的引用
const receivablePriceRankRef = ref() // ReceivablePriceRank 组件的引用
const contractCountRankRef = ref() // ContractCountRank 组件的引用
const productSalesRankRef = ref() // ProductSalesRank 组件的引用
const customerCountRankRef = ref() // CustomerCountRank 组件的引用
const contactsCountRankRef = ref() // ContactsCountRank 组件的引用
const followCountRankRef = ref() // FollowCountRank 组件的引用
const followCustomerCountRankRef = ref() // FollowCustomerCountRank 组件的引用

/** 搜索按钮操作 */
const handleQuery = () => {
  switch (activeTab.value) {
    case 'contractPriceRank':
      contractPriceRankRef.value?.loadData?.()
      break
    case 'receivablePriceRank':
      receivablePriceRankRef.value?.loadData?.()
      break
    case 'contractCountRank':
      contractCountRankRef.value?.loadData?.()
      break
    case 'productSalesRank':
      productSalesRankRef.value?.loadData?.()
      break
    case 'customerCountRank':
      customerCountRankRef.value?.loadData?.()
      break
    case 'contactsCountRank':
      contactsCountRankRef.value?.loadData?.()
      break
    case 'followCountRank':
      followCountRankRef.value?.loadData?.()
      break
    case 'followCustomerCountRank':
      followCustomerCountRankRef.value?.loadData?.()
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
})
</script>
<style lang="scss" scoped></style>
