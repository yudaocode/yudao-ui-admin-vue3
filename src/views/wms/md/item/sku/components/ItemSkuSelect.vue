<!-- WMS 商品 SKU 选择器 -->
<template>
  <Dialog
    v-model="dialogVisible"
    :append-to-body="true"
    :scroll="true"
    max-height="calc(100vh - 220px)"
    title="商品选择"
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
        <el-form-item label="规格名称" prop="name">
          <el-input
            v-model="queryParams.name"
            class="!w-240px"
            clearable
            placeholder="请输入规格名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="规格编号" prop="code">
          <el-input
            v-model="queryParams.code"
            class="!w-240px"
            clearable
            placeholder="请输入规格编号"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="条码" prop="barCode">
          <el-input
            v-model="queryParams.barCode"
            class="!w-240px"
            clearable
            placeholder="请输入条码"
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
        :show-overflow-tooltip="true"
        :stripe="true"
        border
        max-height="calc(100vh - 430px)"
        row-key="id"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick"
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
            <div v-if="row.brandName" class="text-12px text-gray-500">
              品牌：{{ row.brandName }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格信息" min-width="220">
          <template #default="{ row }">
            <div>{{ row.name || '-' }}</div>
            <div v-if="row.code" class="text-12px text-gray-500">编号：{{ row.code }}</div>
            <div v-if="row.barCode" class="text-12px text-gray-500">条码：{{ row.barCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" min-width="160">
          <template #default="{ row }">
            <div v-if="row.costPrice !== undefined">成本价：{{ formatPrice(row.costPrice) }}</div>
            <div v-if="row.sellingPrice !== undefined">
              销售价：{{ formatPrice(row.sellingPrice) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="重量(kg)" min-width="160">
          <template #default="{ row }">
            <div v-if="row.netWeight !== undefined">净重：{{ formatWeight(row.netWeight) }}</div>
            <div v-if="row.grossWeight !== undefined">
              毛重：{{ formatWeight(row.grossWeight) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column align="right" label="长宽高(cm)" min-width="180">
          <template #default="{ row }">
            {{ formatDimensionText(row.length, row.width, row.height) || '-' }}
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
import { ItemSkuApi, ItemSkuVO } from '@/api/wms/md/item/sku'
import { formatDimensionText, formatPrice, formatWeight } from '@/views/wms/utils/format'

/** WMS 商品 SKU 选择器 */
defineOptions({ name: 'WmsItemSkuSelect' })

const message = useMessage() // 消息弹窗
const loading = ref(false) // 列表的加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const list = ref<ItemSkuVO[]>([]) // 当前页 SKU 列表
const total = ref(0) // 列表的总条数
const selectedList = ref<ItemSkuVO[]>([]) // 已选择 SKU 列表
const selectedMap = ref<Map<number, ItemSkuVO>>(new Map()) // 跨页已选择 SKU
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 SKU 编号
const disabledSelectedIds = ref<Set<number>>(new Set()) // 已在业务明细中使用的 SKU 编号
const multiple = ref(true) // 是否允许多选
const preselectDisabled = ref(true) // 是否回显已禁用的 SKU
const syncingSingleSelection = ref(false) // 单选模式同步表格勾选状态中
const tableRef = ref<InstanceType<typeof ElTable>>() // 表格 Ref
const queryFormRef = ref() // 搜索的表单

/** 获得默认的查询参数 */
function getDefaultQueryParams() {
  return {
    pageNo: 1,
    pageSize: 10,
    itemName: undefined as string | undefined,
    itemCode: undefined as string | undefined,
    name: undefined as string | undefined,
    code: undefined as string | undefined,
    barCode: undefined as string | undefined
  }
}
const queryParams = reactive(getDefaultQueryParams())

const emit = defineEmits<{
  change: [list: ItemSkuVO[]]
}>()

/** 打开弹窗 */
const open = async (
  selectedIds?: number[],
  options?: { multiple?: boolean; preselectDisabled?: boolean }
) => {
  dialogVisible.value = true
  multiple.value = options?.multiple ?? true
  preselectDisabled.value = options?.preselectDisabled ?? true
  Object.assign(queryParams, getDefaultQueryParams())
  selectedList.value = []
  selectedMap.value = new Map()
  preSelectedIds.value = selectedIds || []
  disabledSelectedIds.value = new Set(preSelectedIds.value)
  await nextTick()
  tableRef.value?.clearSelection()
  await getList()
}
defineExpose({ open })

/** 查询 SKU 列表（服务端分页 + 服务端筛选） */
const getList = async () => {
  loading.value = true
  try {
    const data = await ItemSkuApi.getItemSkuPage(queryParams)
    list.value = data.list
    total.value = data.total
    await nextTick()
    applyPreSelection()
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

/** 恢复预选状态（当前页可见范围内） */
const applyPreSelection = () => {
  const table = tableRef.value
  if (!table || selectedMap.value.size === 0) {
    return
  }
  list.value.forEach((row) => {
    if (row.id && selectedMap.value.has(row.id)) {
      table.toggleRowSelection(row, true, true)
    }
  })
}

/** 是否允许勾选 SKU */
const isRowSelectable = (row: ItemSkuVO) => {
  return row.id === undefined || !disabledSelectedIds.value.has(row.id)
}

/** 选择变化 */
const handleSelectionChange = async (rows: ItemSkuVO[]) => {
  if (syncingSingleSelection.value) {
    return
  }
  if (!multiple.value) {
    let row: ItemSkuVO | undefined
    for (let i = rows.length - 1; i >= 0; i--) {
      const item = rows[i]
      if (item.id && !disabledSelectedIds.value.has(item.id)) {
        row = item
        break
      }
    }
    selectedMap.value = new Map()
    if (row?.id) {
      selectedMap.value.set(row.id, row)
    }
    selectedList.value = Array.from(selectedMap.value.values())
    syncingSingleSelection.value = true
    await nextTick()
    tableRef.value?.clearSelection()
    if (row) {
      tableRef.value?.toggleRowSelection(row, true)
    }
    await nextTick()
    syncingSingleSelection.value = false
    return
  }
  const currentPageIds = list.value.map((row) => row.id).filter((id): id is number => !!id)
  currentPageIds.forEach((id) => {
    if (!disabledSelectedIds.value.has(id)) {
      selectedMap.value.delete(id)
    }
  })
  rows.forEach((row) => {
    if (row.id) {
      selectedMap.value.set(row.id, row)
    }
  })
  selectedList.value = Array.from(selectedMap.value.values())
}

/** 双击行：切换勾选 */
const handleRowDblClick = (row: ItemSkuVO) => {
  if (row.id && disabledSelectedIds.value.has(row.id)) {
    return
  }
  if (!multiple.value) {
    emit('change', [row])
    dialogVisible.value = false
    return
  }
  tableRef.value?.toggleRowSelection(row)
}

/** 确认选择 */
const handleConfirm = () => {
  const newSelectedList = selectedList.value.filter(
    (sku) => sku.id !== undefined && !disabledSelectedIds.value.has(sku.id)
  )
  if (newSelectedList.length === 0) {
    message.warning('请至少选择一条数据')
    return
  }
  emit('change', newSelectedList)
  dialogVisible.value = false
}
</script>
