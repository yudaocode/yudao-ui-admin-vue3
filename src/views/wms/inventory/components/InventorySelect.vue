<!-- WMS 库存选择器 -->
<template>
  <Dialog
    v-model="dialogVisible"
    :append-to-body="true"
    :scroll="true"
    max-height="calc(100vh - 220px)"
    title="库存选择"
    width="80%"
  >
    <ContentWrap>
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="-mb-15px"
        label-width="80px"
      >
        <el-form-item label="商品名称" prop="itemName">
          <el-input
            v-model="queryParams.itemName"
            class="!w-240px"
            clearable
            placeholder="请输入商品名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="商品编号" prop="itemCode">
          <el-input
            v-model="queryParams.itemCode"
            class="!w-240px"
            clearable
            placeholder="请输入商品编号"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="规格名称" prop="skuName">
          <el-input
            v-model="queryParams.skuName"
            class="!w-240px"
            clearable
            placeholder="请输入规格名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="规格编号" prop="skuCode">
          <el-input
            v-model="queryParams.skuCode"
            class="!w-240px"
            clearable
            placeholder="请输入规格编号"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon class="mr-5px" icon="ep:search" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon class="mr-5px" icon="ep:refresh" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <ContentWrap class="!mb-0">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        :row-key="getRowKey"
        :show-overflow-tooltip="true"
        :stripe="true"
        border
        max-height="calc(100vh - 430px)"
        @row-dblclick="handleRowDblClick"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          :reserve-selection="true"
          :selectable="isRowSelectable"
          align="center"
          type="selection"
          width="50"
        />
        <el-table-column label="商品信息" min-width="220">
          <template #default="{ row }">
            <div>{{ row.itemName || '-' }}</div>
            <div v-if="row.itemCode" class="text-12px text-gray-500">
              商品编号：{{ row.itemCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格信息" min-width="220">
          <template #default="{ row }">
            <div>{{ row.skuName || '-' }}</div>
            <div v-if="row.skuCode" class="text-12px text-gray-500">
              规格编号：{{ row.skuCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="仓库" min-width="180">
          <template #default="{ row }">
            {{ row.warehouseName || '-' }}
          </template>
        </el-table-column>
        <el-table-column align="right" label="可用库存" width="130">
          <template #default="{ row }">
            {{ formatQuantity(row.availableQuantity) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="overflow-hidden">
        <Pagination
          v-model:limit="queryParams.pageSize"
          v-model:page="queryParams.pageNo"
          :total="total"
          @pagination="getList"
        />
      </div>
    </ContentWrap>

    <template #footer>
      <el-button type="primary" @click="handleConfirm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ElTable } from 'element-plus'
import { InventoryApi, InventoryVO } from '@/api/wms/inventory'
import { formatQuantity } from '@/views/wms/utils/format'

export interface InventorySelectRow extends InventoryVO {
  price?: number
  availableQuantity?: number
}

/** WMS 库存选择器 */
defineOptions({ name: 'WmsInventorySelect' })

const props = defineProps<{
  warehouseId?: number
}>()

const message = useMessage() // 消息弹窗
const loading = ref(false) // 列表的加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const list = ref<InventorySelectRow[]>([]) // 库存列表
const total = ref(0) // 列表的总条数
const selectedMap = ref<Map<string, InventorySelectRow>>(new Map()) // 跨页已选择库存
const disabledInventoryKeys = ref<Set<string>>(new Set()) // 已在业务明细中使用的库存
const tableRef = ref<InstanceType<typeof ElTable>>() // 表格 Ref
const queryFormRef = ref() // 搜索的表单

/** 获得默认的查询参数 */
function getDefaultQueryParams() {
  return {
    pageNo: 1,
    pageSize: 10,
    itemName: undefined as string | undefined,
    itemCode: undefined as string | undefined,
    skuName: undefined as string | undefined,
    skuCode: undefined as string | undefined
  }
}
const queryParams = reactive(getDefaultQueryParams())

const emit = defineEmits<{
  change: [list: InventorySelectRow[]]
}>()

/** 打开弹窗 */
const open = async (selectedInventoryKeys: string[] = []) => {
  if (!props.warehouseId) {
    message.warning('请先选择仓库')
    return
  }
  dialogVisible.value = true
  Object.assign(queryParams, getDefaultQueryParams())
  selectedMap.value = new Map()
  disabledInventoryKeys.value = new Set(selectedInventoryKeys)
  await nextTick()
  tableRef.value?.clearSelection()
  await getList()
}
defineExpose({ open })

/** 查询库存列表 */
const getList = async () => {
  loading.value = true
  try {
    const params = {
      ...queryParams,
      type: 'warehouse',
      warehouseId: props.warehouseId,
      onlyPositiveQuantity: true
    }
    const data = await InventoryApi.getInventoryPage(params)
    list.value = data.list.map((inventory: InventoryVO) => ({
      ...inventory,
      availableQuantity: inventory.quantity
    }))
    total.value = data.total
    await nextTick()
    applySelection()
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  Object.assign(queryParams, getDefaultQueryParams())
  queryFormRef.value?.resetFields()
  getList()
}

/** 获得行唯一标识 */
const getRowKey = (row: InventorySelectRow) => {
  return `inventory-${row.id || `${row.skuId}-${row.warehouseId}`}`
}

/** 获得业务库存标识 */
const getInventoryKey = (row: Pick<InventorySelectRow, 'skuId' | 'warehouseId'>) => {
  return row.skuId && row.warehouseId ? `${row.skuId}-${row.warehouseId}` : undefined
}

/** 判断库存是否可选 */
const isRowSelectable = (row: InventorySelectRow) => {
  const key = getInventoryKey(row)
  return !key || !disabledInventoryKeys.value.has(key)
}

/** 恢复当前页选择状态 */
const applySelection = () => {
  const table = tableRef.value
  if (!table || selectedMap.value.size === 0) {
    return
  }
  list.value.forEach((row) => {
    if (selectedMap.value.has(getRowKey(row))) {
      table.toggleRowSelection(row, true)
    }
  })
}

/** 选择行变化 */
const handleSelectionChange = (rows: InventorySelectRow[]) => {
  const currentKeys = new Set(list.value.map((row) => getRowKey(row)))
  currentKeys.forEach((key) => selectedMap.value.delete(key))
  rows
    .filter((row) => isRowSelectable(row))
    .forEach((row) => selectedMap.value.set(getRowKey(row), row))
}

/** 双击行直接选择 */
const handleRowDblClick = (row: InventorySelectRow) => {
  if (!isRowSelectable(row)) {
    message.warning('该库存已添加')
    return
  }
  selectedMap.value.set(getRowKey(row), row)
  handleConfirm()
}

/** 确认选择 */
const handleConfirm = () => {
  const selectedList = Array.from(selectedMap.value.values()).filter((row) => isRowSelectable(row))
  if (selectedList.length === 0) {
    message.warning('请选择库存')
    return
  }
  emit('change', selectedList)
  dialogVisible.value = false
}
</script>
