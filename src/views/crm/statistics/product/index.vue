<!-- 数据统计 - 产品分析 -->
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
      <el-form-item label="时间范围" prop="times">
        <el-date-picker
          v-model="queryParams.times"
          :clearable="false"
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
      <el-form-item label="归属部门" prop="deptId">
        <el-tree-select
          v-model="queryParams.deptId"
          :data="deptList"
          :props="defaultProps"
          check-strictly
          class="!w-240px"
          node-key="id"
          placeholder="请选择归属部门"
          @change="((queryParams.userId = undefined), handleQuery())"
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
            v-for="user in userListByDeptId"
            :key="user.id"
            :label="user.nickname"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品分类" prop="categoryId">
        <el-tree-select
          v-model="queryParams.categoryId"
          :data="productCategoryList"
          :props="defaultProps"
          check-strictly
          class="!w-240px"
          clearable
          node-key="id"
          placeholder="请选择产品分类"
          @change="handleQuery"
        />
      </el-form-item>
      <el-form-item label="产品" prop="productId">
        <el-select
          v-model="queryParams.productId"
          class="!w-240px"
          clearable
          filterable
          placeholder="请选择产品"
          @change="handleQuery"
        >
          <el-option
            v-for="product in productList"
            :key="product.id"
            :label="product.name"
            :value="product.id"
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

  <!-- 产品分析 -->
  <el-col>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="产品销售情况统计" lazy name="productSalesList">
        <ProductSalesList ref="productSalesListRef" :query-params="queryParams" />
      </el-tab-pane>
      <el-tab-pane label="产品分类销售分析" lazy name="productCategorySummary">
        <ProductCategorySummary ref="productCategorySummaryRef" :query-params="queryParams" />
      </el-tab-pane>
    </el-tabs>
  </el-col>
</template>

<script lang="ts" setup>
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import * as ProductApi from '@/api/crm/product'
import * as ProductCategoryApi from '@/api/crm/product/category'
import { useUserStore } from '@/store/modules/user'
import { beginOfDay, defaultShortcuts, endOfDay, formatDate } from '@/utils/formatTime'
import { defaultProps, handleTree } from '@/utils/tree'
import ProductSalesList from './components/ProductSalesList.vue'
import ProductCategorySummary from './components/ProductCategorySummary.vue'

defineOptions({ name: 'CrmStatisticsProduct' })

const queryParams = reactive({
  deptId: useUserStore().getUser.deptId,
  userId: undefined,
  categoryId: undefined,
  productId: undefined,
  times: [
    formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 30))),
    formatDate(endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24)))
  ]
})

const queryFormRef = ref() // 搜索的表单
const deptList = ref<Tree[]>([]) // 部门树形结构
const userList = ref<UserApi.UserVO[]>([]) // 全量用户清单
const productCategoryList = ref<any[]>([]) // 产品分类树
const productList = ref<ProductApi.ProductVO[]>([]) // 产品列表

/** 根据选择的部门筛选员工清单 */
const userListByDeptId = computed(() =>
  queryParams.deptId
    ? userList.value.filter((user: UserApi.UserVO) => user.deptId === queryParams.deptId)
    : []
)

const activeTab = ref('productSalesList') // 活跃标签
const productSalesListRef = ref() // 产品销售情况统计
const productCategorySummaryRef = ref() // 产品分类销售分析

/** 搜索按钮操作 */
const handleQuery = () => {
  switch (activeTab.value) {
    case 'productSalesList':
      productSalesListRef.value?.loadData?.()
      break
    case 'productCategorySummary':
      productCategorySummaryRef.value?.loadData?.()
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
  userList.value = await UserApi.getSimpleUserList()
  productCategoryList.value = handleTree(
    await ProductCategoryApi.getProductCategoryList({}),
    'id',
    'parentId'
  )
  productList.value = await ProductApi.getProductSimpleList()
})
</script>
