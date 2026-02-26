<!-- TODO @AI：这些组件，已经有了，你找下 -->
<template>
  <el-dialog v-model="dialogVisible" title="选择库存" width="1200px" @close="handleClose">
    <el-form :inline="true" :model="queryParams" class="mb-10px">
      <el-form-item label="批次号">
        <el-input
          v-model="queryParams.batchCode"
          placeholder="请输入批次号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="仓库">
        <el-input
          v-model="queryParams.warehouseName"
          placeholder="请输入仓库名称"
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
      <el-table-column label="批次号" prop="batchCode" width="150" />
      <el-table-column label="仓库" prop="warehouseName" width="150" />
      <el-table-column label="库区" prop="locationName" width="150" />
      <el-table-column label="库位" prop="areaName" width="150" />
      <el-table-column label="可用数量" prop="quantityOnhand" width="120" />
      <el-table-column label="冻结数量" prop="quantityFrozen" width="120" />
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
import { MaterialStockApi } from '@/api/mes/wm/materialstock'

defineOptions({ name: 'StockSelect' })

const emit = defineEmits(['select'])

const dialogVisible = ref(false)
const loading = ref(false)
const list = ref([])
const total = ref(0)
const selectedRow = ref(null)
const currentItemId = ref(null)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  itemId: undefined,
  batchCode: undefined,
  warehouseName: undefined
})

const open = (itemId?: number) => {
  currentItemId.value = itemId
  queryParams.itemId = itemId
  dialogVisible.value = true
  getList()
}

const handleClose = () => {
  dialogVisible.value = false
  selectedRow.value = null
  currentItemId.value = null
}

const getList = async () => {
  loading.value = true
  try {
    const data = await MaterialStockApi.getMaterialStockPage(queryParams)
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
  queryParams.batchCode = undefined
  queryParams.warehouseName = undefined
  queryParams.itemId = currentItemId.value
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
    materialStockId: selectedRow.value.id,
    batchId: selectedRow.value.batchId,
    batchCode: selectedRow.value.batchCode,
    warehouseId: selectedRow.value.warehouseId,
    warehouseName: selectedRow.value.warehouseName,
    locationId: selectedRow.value.locationId,
    locationName: selectedRow.value.locationName,
    areaId: selectedRow.value.areaId,
    areaName: selectedRow.value.areaName,
    availableQuantity: selectedRow.value.quantityOnhand
  })
  handleClose()
}

defineExpose({ open })
</script>
