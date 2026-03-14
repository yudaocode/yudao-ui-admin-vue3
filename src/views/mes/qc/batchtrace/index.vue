<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="批次号" prop="code">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入批次号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品物料编码" prop="itemCode">
        <el-input
          v-model="queryParams.itemCode"
          placeholder="请输入产品物料编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="产品物料名称" prop="itemName">
        <el-input
          v-model="queryParams.itemName"
          placeholder="请输入产品物料名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="供应商编码" prop="vendorCode">
        <el-input
          v-model="queryParams.vendorCode"
          placeholder="请输入供应商编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="供应商名称" prop="vendorName">
        <el-input
          v-model="queryParams.vendorName"
          placeholder="请输入供应商名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="客户编码" prop="clientCode">
        <el-input
          v-model="queryParams.clientCode"
          placeholder="请输入客户编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="客户名称" prop="clientName">
        <el-input
          v-model="queryParams.clientName"
          placeholder="请输入客户名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="销售订单编号" prop="salesOrderCode">
        <el-input
          v-model="queryParams.salesOrderCode"
          placeholder="请输入销售订单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="采购订单编号" prop="purchaseOrderCode">
        <el-input
          v-model="queryParams.purchaseOrderCode"
          placeholder="请输入采购订单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="批次编号" align="center" prop="code" />
      <el-table-column label="产品物料编码" align="center" prop="itemCode" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" />
      <el-table-column label="规格型号" align="center" prop="itemSpecification" />
      <el-table-column label="单位" align="center" prop="unitName" />
      <el-table-column label="供应商编码" align="center" prop="vendorCode" />
      <el-table-column label="供应商名称" align="center" prop="vendorName" />
      <el-table-column label="客户编码" align="center" prop="clientCode" />
      <el-table-column label="客户名称" align="center" prop="clientName" />
      <el-table-column label="销售订单编号" align="center" prop="salesOrderCode" />
      <el-table-column label="采购订单编号" align="center" prop="purchaseOrderCode" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleTrace(scope.row)"
            v-hasPermi="['mes:wm-batch:query']"
          >
            批次追溯
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 批次追溯对话框 -->
  <el-dialog :title="title" v-model="open" width="960px" append-to-body>
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-row>
        <el-col :span="8">
          <el-form-item label="批次编号" prop="code">
            <el-input v-model="form.code" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="物资编码" prop="itemCode">
            <el-input v-model="form.itemCode" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="物资名称" prop="itemName">
            <el-input v-model="form.itemName" readonly />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="规格型号" prop="itemSpecification">
            <el-input v-model="form.itemSpecification" type="textarea" readonly />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="采购订单编号" prop="purchaseOrderCode">
            <el-input v-model="form.purchaseOrderCode" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商编码" prop="vendorCode">
            <el-input v-model="form.vendorCode" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="供应商名称" prop="vendorName">
            <el-input v-model="form.vendorName" readonly />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="销售订单编号" prop="salesOrderCode">
            <el-input v-model="form.salesOrderCode" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户编码" prop="clientCode">
            <el-input v-model="form.clientCode" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="客户名称" prop="clientName">
            <el-input v-model="form.clientName" readonly />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="生产批号" prop="lotNumber">
            <el-input v-model="form.lotNumber" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="生产工单" prop="workOrderCode">
            <el-input v-model="form.workOrderCode" readonly />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="工作站编码" prop="workstationCode">
            <el-input v-model="form.workstationCode" readonly />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-tabs type="border-card">
      <el-tab-pane label="向前追溯">
        <Forward :batchId="form.id" :batchCode="form.code" />
      </el-tab-pane>
      <el-tab-pane label="向后追溯">
        <Backward :batchId="form.id" :batchCode="form.code" />
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="cancel">关 闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="BatchTrace">
// TODO @AI：代码风格，对齐 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/system/user/index.vue

import { ref } from 'vue'
import { BatchVO } from '@/api/mes/wm/batch'
import Forward from './forward.vue'
import Backward from './backward.vue'

// TODO @AI：需要实现批次列表查询 API
const loading = ref(true)
const total = ref(0)
const list = ref<BatchVO[]>([])
const open = ref(false)
const title = ref('')
const form = ref<BatchVO>({} as BatchVO)
const queryFormRef = ref()

const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  itemCode: undefined,
  itemName: undefined,
  vendorCode: undefined,
  vendorName: undefined,
  clientCode: undefined,
  clientName: undefined,
  salesOrderCode: undefined,
  purchaseOrderCode: undefined
})

const getList = async () => {
  loading.value = true
  try {
    // TODO @AI：调用批次列表查询 API
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

const handleTrace = (row: BatchVO) => {
  form.value = { ...row }
  open.value = true
  title.value = '批次追溯'
}

const cancel = () => {
  open.value = false
  form.value = {} as BatchVO
}

// 初始加载
getList()
</script>
