<!-- TODO @AI：这些组件，已经有了，你找下 -->
<template>
  <el-dialog v-model="dialogVisible" title="选择生产工单" width="1200px" @close="handleClose">
    <el-form :inline="true" :model="queryParams" class="mb-10px">
      <el-form-item label="工单编号">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工单编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="产品名称">
        <el-input
          v-model="queryParams.productName"
          placeholder="请输入产品名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-5px" /> 重置 </el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="list"
      @row-click="handleRowClick"
      highlight-current-row
      max-height="400px"
    >
      <el-table-column label="工单编号" prop="code" width="150" />
      <el-table-column label="产品编号" prop="productCode" width="150" />
      <el-table-column label="产品名称" prop="productName" width="200" />
      <el-table-column label="计划数量" prop="planQuantity" width="120" />
      <el-table-column label="状态" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WORK_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { WorkOrderApi } from '@/api/mes/pro/workorder'

defineOptions({ name: 'WorkorderSelect' })

const emit = defineEmits(['select'])

const dialogVisible = ref(false)
const loading = ref(false)
const list = ref([])
const total = ref(0)
const selectedRow = ref(null)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  productName: undefined
})

const open = () => {
  dialogVisible.value = true
  getList()
}

const handleClose = () => {
  dialogVisible.value = false
  selectedRow.value = null
}

const getList = async () => {
  loading.value = true
  try {
    const data = await WorkOrderApi.getWorkOrderPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryParams.code = undefined
  queryParams.productName = undefined
  handleQuery()
}

const handleRowClick = (row: any) => {
  selectedRow.value = row
}

const handleConfirm = () => {
  if (!selectedRow.value) {
    return
  }
  emit('select', {
    workorderId: selectedRow.value.id,
    workorderCode: selectedRow.value.code,
    productCode: selectedRow.value.productCode,
    productName: selectedRow.value.productName
  })
  handleClose()
}

defineExpose({ open })
</script>
