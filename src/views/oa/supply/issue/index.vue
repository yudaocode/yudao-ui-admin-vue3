<template>
  <doc-alert
    title="【行政】办公用品、用印管理"
    url="https://doc.iocoder.cn/oa/administration/supply-seal/"
  />
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      ref="queryFormRef"
      :model="queryParams"
      :inline="true"
      label-width="80px"
      class="-mb-15px"
    >
      <el-form-item label="物品名称" prop="itemName">
        <el-input
          v-model="queryParams.itemName"
          placeholder="请输入物品名称"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="申请人" prop="creatorName">
        <el-input
          v-model="queryParams.creatorName"
          placeholder="请输入申请人"
          clearable
          class="!w-240px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="管理类型" prop="manageType">
        <el-select
          v-model="queryParams.manageType"
          placeholder="请选择管理类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SUPPLY_MANAGE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="使用类型" prop="useType">
        <el-select
          v-model="queryParams.useType"
          placeholder="请选择使用类型"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.OA_SUPPLY_USE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="申请时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          range-separator="至"
          value-format="YYYY-MM-DD HH:mm:ss"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="申请单号" prop="no" min-width="160" />
      <el-table-column label="申请人" prop="creatorName" min-width="100" />
      <el-table-column label="申请部门" prop="deptName" min-width="120" />
      <el-table-column label="使用类型" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SUPPLY_USE_TYPE" :value="row.useType" />
        </template>
      </el-table-column>
      <el-table-column label="物品名称" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" prop="model" min-width="100" />
      <el-table-column label="计量单位" prop="unit" width="80" align="center" />
      <el-table-column label="管理类型" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="row.manageType" />
        </template>
      </el-table-column>
      <el-table-column label="申请数量" prop="applyQuantity" width="80" align="center" />
      <el-table-column label="实发数量" prop="issuedQuantity" width="80" align="center" />
      <el-table-column label="已归还" prop="returnedQuantity" width="80" align="center" />
      <el-table-column label="状态" width="120">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SUPPLY_ITEM_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="发放人" prop="issueUserName" min-width="100" />
      <el-table-column label="发放时间" prop="issueTime" :formatter="dateFormatter" width="180" />
      <el-table-column label="操作" fixed="right" width="80">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 0"
            v-hasPermi="['oa:supply-issue:issue']"
            link
            type="primary"
            @click="openIssueForm(row)"
          >
            发放
          </el-button>
          <el-button
            v-if="row.status === 2"
            v-hasPermi="['oa:supply-issue:return']"
            link
            type="primary"
            @click="openReturnForm(row)"
          >
            归还
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
  <!-- 发放弹窗 -->
  <OaSupplyIssueForm ref="issueFormRef" @success="getList" />
  <!-- 归还弹窗 -->
  <OaSupplyReturnForm ref="returnFormRef" @success="getList" />
</template>

<script setup lang="ts">
import * as SupplyIssueApi from '@/api/oa/supply/issue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import OaSupplyIssueForm from './OaSupplyIssueForm.vue'
import OaSupplyReturnForm from './OaSupplyReturnForm.vue'

defineOptions({ name: 'OaSupplyIssue' })

const loading = ref(true) // 列表加载中
const list = ref<SupplyIssueApi.SupplyApplyItemVO[]>([]) // 列表数据
const total = ref(0) // 列表总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  itemName: undefined,
  creatorName: undefined,
  manageType: undefined,
  useType: undefined,
  createTime: []
}) // 查询条件
const queryFormRef = ref() // 搜索表单

/** 查询列表 */
async function getList() {
  loading.value = true
  try {
    const data = await SupplyIssueApi.getSupplyApplyItemPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 发放操作 */
const issueFormRef = ref() // 发放表单
function openIssueForm(row: SupplyIssueApi.SupplyApplyItemVO) {
  issueFormRef.value.open(row)
}

/** 归还操作 */
const returnFormRef = ref() // 归还表单
function openReturnForm(row: SupplyIssueApi.SupplyApplyItemVO) {
  returnFormRef.value.open(row)
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
