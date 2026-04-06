<!--
  MES 批次弹窗选择器（支持单选/多选）

  对齐 KTG batchSelect/single.vue 的搜索字段和展示字段
  架构对齐 MdVendorSelectDialog.vue（ContentWrap 两栏布局 + 分页）

  Props:
    multiple — true 多选（checkbox），false 单选（radio）；默认 true
  Events:
    selected(rows: BatchVO[]) — 确认选择后触发，单选时数组长度为 1
  Expose:
    open(selectedIds?, itemId?) — 打开弹窗，可传入已选 ID 用于预选高亮，itemId 用于默认过滤物料
-->
<template>
  <Dialog title="批次选择" v-model="dialogVisible" width="75%">
    <ContentWrap>
      <el-form :inline="true" :model="queryParams" label-width="100px">
        <el-form-item label="批次编号">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入批次编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="产品物料">
          <MdItemSelect
            v-model="queryParams.itemId"
            placeholder="请选择产品物料"
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="生产工单">
          <ProWorkOrderSelect
            v-model="queryParams.workOrderId"
            placeholder="请选择生产工单"
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="销售订单编号">
          <el-input
            v-model="queryParams.salesOrderCode"
            placeholder="请输入销售订单编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="采购订单编号">
          <el-input
            v-model="queryParams.purchaseOrderCode"
            placeholder="请输入采购订单编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" /> 搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" /> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>
    <!-- 数据表格：对齐 KTG 展示字段 -->
    <ContentWrap>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        border
        row-key="id"
        :highlight-current-row="!multiple"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        @row-dblclick="handleRowDblClick"
      >
        <!-- 多选：checkbox -->
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
        <el-table-column label="批次编号" align="center" prop="code" width="150" />
        <el-table-column label="物料编码" align="center" prop="itemCode" width="150" />
        <el-table-column label="物料名称" align="left" prop="itemName" min-width="140" />
        <el-table-column label="规格型号" align="center" prop="itemSpecification" width="120" />
        <el-table-column label="单位" align="center" prop="unitName" width="80" />
        <el-table-column label="供应商编码" align="center" prop="vendorCode" width="120" />
        <el-table-column label="供应商名称" align="center" prop="vendorName" width="120" />
        <el-table-column label="客户编码" align="center" prop="clientCode" width="110" />
        <el-table-column label="客户名称" align="center" prop="clientName" width="110" />
        <el-table-column label="销售订单编号" align="center" prop="salesOrderCode" width="140" />
        <el-table-column label="采购订单编号" align="center" prop="purchaseOrderCode" width="140" />
        <el-table-column label="工单编码" align="center" prop="workOrderCode" width="140" />
        <el-table-column label="生产批号" align="center" prop="lotNumber" width="120" />
        <el-table-column label="生产日期" align="center" prop="produceDate" width="120">
          <template #default="scope">
            <span>{{ formatDate(scope.row.produceDate, 'YYYY-MM-DD') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" align="center" prop="expireDate" width="120">
          <template #default="scope">
            <span>{{ formatDate(scope.row.expireDate, 'YYYY-MM-DD') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库日期" align="center" prop="receiptDate" width="120">
          <template #default="scope">
            <span>{{ formatDate(scope.row.receiptDate, 'YYYY-MM-DD') }}</span>
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
    <template #footer>
      <el-button type="primary" @click="confirmSelect">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils/formatTime'
import { BatchApi, BatchVO } from '@/api/mes/wm/batch'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'

defineOptions({ name: 'WmBatchSelectDialog' })

const props = withDefaults(
  defineProps<{
    multiple?: boolean // true 多选（checkbox），false 单选（radio）
  }>(),
  {
    multiple: true
  }
)

const message = useMessage()
const emit = defineEmits<{
  selected: [rows: BatchVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<BatchVO[]>([]) // 批次列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRows = ref<BatchVO[]>([]) // 多选模式：选中行
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<BatchVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: BatchVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: BatchVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中 */
const handleRowClick = (row: BatchVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选模式切换勾选，单选模式直接确认 */
const handleRowDblClick = (row: BatchVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
  confirmSelect()
}

// ==================== 批次查询 ====================
const queryParams = reactive({
  pageNo: 1, // 页码
  pageSize: 10, // 每页条数
  code: undefined as string | undefined, // 批次编码
  itemId: undefined as number | undefined, // 物料 ID（MdItemSelect）
  workOrderId: undefined as number | undefined, // 工单 ID（ProWorkOrderSelect）
  salesOrderCode: undefined as string | undefined, // 销售订单编号
  purchaseOrderCode: undefined as string | undefined // 采购订单编号
})

/** 查询批次列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await BatchApi.getBatchPage(queryParams)
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

/** 重置查询条件 */
const resetQuery = () => {
  queryParams.code = undefined
  queryParams.itemId = undefined
  queryParams.workOrderId = undefined
  queryParams.salesOrderCode = undefined
  queryParams.purchaseOrderCode = undefined
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

/**
 * 打开弹窗
 * @param selectedIds 已选 ID，用于预选高亮
 * @param itemId 默认过滤的物料 ID（由外层 WmBatchSelect 的 itemId prop 传入）
 */
const open = async (selectedIds?: number[], itemId?: number) => {
  dialogVisible.value = true
  // 重置查询条件 + 页码，避免二次打开继承上次过滤上下文
  queryParams.code = undefined
  queryParams.itemId = itemId ?? undefined // 传入 itemId 则默认按物料过滤
  queryParams.workOrderId = undefined
  queryParams.salesOrderCode = undefined
  queryParams.purchaseOrderCode = undefined
  queryParams.pageNo = 1
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
</script>

<style lang="scss" scoped>
/* 隐藏 radio 的 label 文字，只保留圆圈 */
.radio-no-label {
  :deep(.el-radio__label) {
    display: none;
  }
}
</style>
