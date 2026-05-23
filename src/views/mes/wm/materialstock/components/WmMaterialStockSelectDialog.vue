<!--
  MES 库存弹窗选择器（支持单选/多选）

  Props:
    multiple       — true 多选（checkbox），false 单选（radio）；默认 true
    itemId         — 按物料 ID 过滤库存（可选）
    batchId        — 按批次 ID 过滤库存（可选）
    warehouseId    — 按仓库 ID 过滤库存（可选）
    virtualFilter  — 虚拟线边仓过滤模式：'exclude' 排除虚拟仓（默认），'only' 只看虚拟仓，'all' 不过滤
  Events:
    selected(rows: WmMaterialStockVO[]) — 确认选择后触发，单选时数组长度为 1
  Expose:
    open(selectedIds?: number[]) — 打开弹窗，可传入已选 ID 用于预选高亮
-->
<template>
  <Dialog title="库存物资选择" v-model="dialogVisible" width="80%">
    <el-row :gutter="20">
      <!-- 左侧：分类树 -->
      <el-col :span="4" :xs="24">
        <ContentWrap class="h-1/1">
          <MdItemTypeTree ref="typeTreeRef" @node-click="handleNodeClick" />
        </ContentWrap>
      </el-col>
      <!-- 右侧：搜索 + 表格 -->
      <el-col :span="20" :xs="24">
        <!-- 预过滤提示 -->
        <ContentWrap>
          <el-alert
            v-if="showAlert"
            :title="alertTitle"
            type="info"
            :closable="false"
            show-icon
            class="!mb-10px"
          />
          <el-form :inline="true" :model="queryParams" label-width="68px">
            <el-form-item label="物料">
              <MdItemSelect v-model="queryParams.itemId" class="!w-220px" />
            </el-form-item>
            <el-form-item label="供应商">
              <MdVendorSelect v-model="queryParams.vendorId" class="!w-220px" />
            </el-form-item>
            <el-form-item label="批次号">
              <el-input
                v-model="queryParams.batchCode"
                placeholder="请输入批次号"
                clearable
                @keyup.enter="handleQuery"
                class="!w-220px"
              />
            </el-form-item>
            <el-form-item label="仓库">
              <WmWarehouseSelect
                v-model="queryParams.warehouseId"
                @change="handleWarehouseChange"
                class="!w-220px"
              />
            </el-form-item>
            <!-- DONE @AI：areaId 增加一个 -->
            <el-form-item label="库区">
              <WmWarehouseLocationSelect
                v-model="queryParams.locationId"
                :warehouse-id="queryParams.warehouseId"
                @change="handleLocationChange"
                class="!w-220px"
              />
            </el-form-item>
            <el-form-item label="库位">
              <WmWarehouseAreaSelect
                v-model="queryParams.areaId"
                :location-id="queryParams.locationId"
                class="!w-220px"
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="handleQuery"
                ><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button
              >
              <el-button @click="resetQuery"
                ><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button
              >
            </el-form-item>
          </el-form>
        </ContentWrap>
        <!-- 列表 -->
        <ContentWrap>
          <el-table
            ref="tableRef"
            v-loading="loading"
            :data="list"
            :stripe="true"
            :show-overflow-tooltip="true"
            row-key="id"
            :highlight-current-row="!multiple"
            @selection-change="handleSelectionChange"
            @row-click="handleRowClick"
            @row-dblclick="handleRowDblClick"
          >
            <!-- 多选：checkbox（reserve-selection 保证跨页勾选不丢失） -->
            <el-table-column
              v-if="multiple"
              type="selection"
              :reserve-selection="true"
              width="50"
              align="center"
            />
            <!-- 单选：radio -->
            <el-table-column v-else width="50" align="center">
              <template #default="{ row }">
                <el-radio
                  v-model="selectedRadioId"
                  :value="row.id"
                  class="radio-no-label"
                  @change="handleRadioChange(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="产品物料编码" align="center" prop="itemCode" min-width="120" />
            <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="140" />
            <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
            <el-table-column label="单位" align="center" prop="unitMeasureName" min-width="80" />
            <el-table-column label="入库批次号" align="center" prop="batchCode" min-width="120" />
            <el-table-column label="仓库" align="center" prop="warehouseName" min-width="100" />
            <el-table-column label="库区" align="center" prop="locationName" min-width="100" />
            <el-table-column label="库位" align="center" prop="areaName" min-width="100" />
            <el-table-column label="在库数量" align="center" prop="quantity" min-width="100" />
            <el-table-column
              label="入库日期"
              align="center"
              prop="receiptTime"
              :formatter="dateFormatter2"
              width="180px"
            />
          </el-table>
          <!-- 分页 -->
          <Pagination
            :total="total"
            v-model:page="queryParams.pageNo"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </ContentWrap>
      </el-col>
    </el-row>
    <template #footer>
      <el-button type="primary" @click="confirmSelect">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { dateFormatter2 } from '@/utils/formatTime'
import { WmMaterialStockApi, WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import { MdItemTypeVO } from '@/api/mes/md/item/type'
import MdItemTypeTree from '@/views/mes/md/item/type/components/MdItemTypeTree.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'WmMaterialStockSelectDialog' })

const props = withDefaults(
  defineProps<{
    multiple?: boolean // true 多选（checkbox），false 单选（radio）
    itemId?: number // 按物料 ID 过滤
    batchId?: number // 按批次 ID 过滤
    warehouseId?: number // 按仓库 ID 过滤
    virtualFilter?: 'exclude' | 'only' | 'all' // 虚拟仓过滤：'exclude' 排除（默认），'only' 只看，'all' 不过滤
  }>(),
  {
    multiple: true,
    virtualFilter: 'exclude'
  }
)

const message = useMessage()
const emit = defineEmits<{
  selected: [rows: WmMaterialStockVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<WmMaterialStockVO[]>([]) // 库存列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const typeTreeRef = ref() // 分类树 Ref
const selectedRows = ref<WmMaterialStockVO[]>([]) // 多选模式：选中行
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<WmMaterialStockVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: WmMaterialStockVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: WmMaterialStockVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中（降低操作成本），多选不处理（避免和 dblclick 冲突） */
const handleRowClick = (row: WmMaterialStockVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选模式切换勾选，单选模式直接确认 */
const handleRowDblClick = (row: WmMaterialStockVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
  confirmSelect()
}

// ==================== 分类树 ====================

/** 点击分类树节点，按分类筛选（支持取消选中） */
const handleNodeClick = (data: MdItemTypeVO | undefined) => {
  queryParams.itemTypeId = data?.id
  handleQuery()
}

// ==================== 库存查询 ====================
const queryParams = reactive({
  pageNo: 1, // 页码
  pageSize: 10, // 每页条数
  itemTypeId: undefined as number | undefined, // 物料分类编号
  itemId: undefined as number | undefined, // 物料编号
  vendorId: undefined as number | undefined, // 供应商编号
  batchCode: undefined as string | undefined, // 批次号
  batchId: undefined as number | undefined, // 批次 ID
  warehouseId: undefined as number | undefined, // 仓库编号
  locationId: undefined as number | undefined, // 库区编号
  areaId: undefined as number | undefined, // 库位编号
  frozen: false as boolean | undefined, // 默认只查未冻结
  virtualFilter: undefined as string | undefined // 虚拟仓过滤：exclude / only，由后端处理
})

/** 仓库切换时清空库区、库位 */
const handleWarehouseChange = () => {
  queryParams.locationId = undefined
  queryParams.areaId = undefined
}

/** 库区切换时清空库位 */
const handleLocationChange = () => {
  queryParams.areaId = undefined
}

/** 查询库存列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await WmMaterialStockApi.getMaterialStockPage(queryParams)
    list.value = data.list
    total.value = data.total
    await nextTick()
    applyPreSelection()
  } finally {
    loading.value = false
  }
}

/** 恢复预选状态（当前页可见范围内） */
const applyPreSelection = () => {
  if (preSelectedIds.value.length === 0) {
    return
  }
  if (props.multiple) {
    const table = tableRef.value
    if (!table) {
      return
    }
    list.value.forEach((row) => {
      if (preSelectedIds.value.includes(row.id)) {
        table.toggleRowSelection(row, true)
      }
    })
  } else {
    const match = list.value.find((row) => preSelectedIds.value.includes(row.id))
    if (match) {
      selectedRadioId.value = match.id
      currentRadioRow.value = match
    }
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置查询条件（同步清除左侧树高亮和搜索词） */
const resetQuery = () => {
  queryParams.itemTypeId = undefined
  queryParams.itemId = props.itemId // 保持 props 传入的物料过滤
  queryParams.vendorId = undefined
  queryParams.batchCode = undefined
  queryParams.batchId = props.batchId // 保持 props 传入的批次过滤
  queryParams.warehouseId = props.warehouseId // 保持 props 传入的仓库过滤
  queryParams.virtualFilter = props.virtualFilter === 'all' ? undefined : props.virtualFilter
  queryParams.locationId = undefined
  queryParams.areaId = undefined
  typeTreeRef.value?.reset()
  handleQuery()
}

/** 确认选择 */
const confirmSelect = () => {
  if (props.multiple) {
    if (selectedRows.value.length === 0) {
      message.warning('请至少选择一条数据')
      return
    }
    emit('selected', selectedRows.value)
  } else {
    if (!currentRadioRow.value) {
      message.warning('请选择一条数据')
      return
    }
    emit('selected', [currentRadioRow.value])
  }
  dialogVisible.value = false
}

// ==================== 打开弹窗 ====================

/** 打开弹窗，可传入已选 ID 用于预选高亮 */
const open = async (selectedIds?: number[]) => {
  dialogVisible.value = true
  // 重置查询条件 + 页码，避免二次打开继承上次过滤上下文
  queryParams.itemTypeId = undefined
  queryParams.vendorId = undefined
  queryParams.batchCode = undefined
  queryParams.locationId = undefined
  queryParams.areaId = undefined
  queryParams.pageNo = 1
  // 固定过滤条件（从 props 传入）
  queryParams.itemId = props.itemId
  queryParams.batchId = props.batchId
  queryParams.warehouseId = props.warehouseId
  queryParams.virtualFilter = props.virtualFilter === 'all' ? undefined : props.virtualFilter
  // 默认只查未冻结
  queryParams.frozen = false
  // 重置分类树（清高亮 + 清搜索词）
  typeTreeRef.value?.reset()
  // 清空上一次的选中状态
  selectedRows.value = []
  selectedRadioId.value = undefined
  currentRadioRow.value = undefined
  preSelectedIds.value = selectedIds ?? []
  // 多选模式清空跨页缓存的勾选
  await nextTick()
  tableRef.value?.clearSelection()
  await getList()
}
defineExpose({ open })

// ==================== 预过滤提示 ====================

/** 拼装 el-alert 提示文字 */
const alertTitle = computed(() => {
  const parts: string[] = []
  if (props.batchId != null) {
    parts.push('批次')
  }
  if (props.warehouseId != null) {
    parts.push('仓库')
  }
  if (props.virtualFilter === 'only') {
    parts.push('只看虚拟仓')
  }
  return `已按${parts.join('/')}预过滤`
})

/** 是否显示 alert 提示 */
const showAlert = computed(() => {
  return props.batchId != null || props.warehouseId != null || props.virtualFilter === 'only'
})
</script>

<style lang="scss" scoped>
/* 隐藏 radio 的 label 文字，只保留圆圈 */
.radio-no-label {
  :deep(.el-radio__label) {
    display: none;
  }
}
</style>
