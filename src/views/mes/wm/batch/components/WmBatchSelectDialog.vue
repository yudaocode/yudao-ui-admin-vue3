<!--
  MES 批次弹窗选择器（支持单选/多选）

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
      <el-alert
        v-if="showAlert"
        :title="alertTitle"
        type="info"
        :closable="false"
        show-icon
        class="!mb-10px"
      />
      <el-form :inline="true" :model="queryParams" label-width="100px">
        <el-form-item label="批次编号">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入批次编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="产品物料">
          <MdItemSelect
            v-model="queryParams.itemId"
            placeholder="请选择产品物料"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="供应商">
          <MdVendorSelect
            v-model="queryParams.vendorId"
            placeholder="请选择供应商"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="客户">
          <MdClientSelect
            v-model="queryParams.clientId"
            placeholder="请选择客户"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="生产工单">
          <ProWorkOrderSelect
            v-model="queryParams.workOrderId"
            placeholder="请选择生产工单"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="生产任务">
          <ProTaskSelect
            v-model="queryParams.taskId"
            placeholder="请选择生产任务"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="工作站">
          <MdWorkstationSelect
            v-model="queryParams.workstationId"
            placeholder="请选择工作站"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="工具">
          <TmToolSelect v-model="queryParams.toolId" placeholder="请选择工具" class="!w-220px" />
        </el-form-item>
        <el-form-item label="模具编号">
          <el-input
            v-model="queryParams.moldId"
            placeholder="请输入模具编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="销售订单编号">
          <el-input
            v-model="queryParams.salesOrderCode"
            placeholder="请输入销售订单编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="采购订单编号">
          <el-input
            v-model="queryParams.purchaseOrderCode"
            placeholder="请输入采购订单编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="生产批号">
          <el-input
            v-model="queryParams.lotNumber"
            placeholder="请输入生产批号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="质量状态">
          <el-select
            v-model="queryParams.qualityStatus"
            placeholder="请选择质量状态"
            clearable
            class="!w-220px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_QUALITY_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生产日期">
          <el-date-picker
            v-model="queryParams.produceDate"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="queryParams.expireDate"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="入库日期">
          <el-date-picker
            v-model="queryParams.receiptDate"
            value-format="YYYY-MM-DD HH:mm:ss"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="!w-220px"
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
    <!-- 数据表格 -->
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
        <el-table-column label="工作站编码" align="center" prop="workstationCode" width="120" />
        <el-table-column label="生产任务编号" align="center" prop="taskCode" width="140" />
        <el-table-column label="工具编号" align="center" prop="toolCode" width="120" />
        <el-table-column label="生产批号" align="center" prop="lotNumber" width="120" />
        <el-table-column label="质量状态" align="center" prop="qualityStatus" width="100">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.MES_WM_QUALITY_STATUS" :value="scope.row.qualityStatus" />
          </template>
        </el-table-column>
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { BatchApi, BatchVO } from '@/api/mes/wm/batch'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdVendorSelect from '@/views/mes/md/vendor/components/MdVendorSelect.vue'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import ProTaskSelect from '@/views/mes/pro/task/components/ProTaskSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'
import TmToolSelect from '@/views/mes/tm/tool/components/TmToolSelect.vue'

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
  vendorId: undefined as number | undefined, // 供应商 ID（MdVendorSelect）
  clientId: undefined as number | undefined, // 客户 ID（MdClientSelect）
  workOrderId: undefined as number | undefined, // 工单 ID（ProWorkOrderSelect）
  taskId: undefined as number | undefined, // 生产任务 ID（ProTaskSelect）
  workstationId: undefined as number | undefined, // 工作站 ID（MdWorkstationSelect）
  toolId: undefined as number | undefined, // 工具 ID（TmToolSelect）
  moldId: undefined as number | undefined, // 模具 ID
  salesOrderCode: undefined as string | undefined, // 销售订单编号
  purchaseOrderCode: undefined as string | undefined, // 采购订单编号
  lotNumber: undefined as string | undefined, // 生产批号
  qualityStatus: undefined as number | undefined, // 质量状态
  produceDate: undefined as string[] | undefined, // 生产日期范围
  expireDate: undefined as string[] | undefined, // 有效期范围
  receiptDate: undefined as string[] | undefined // 入库日期范围
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
  queryParams.vendorId = externalVendorId.value
  queryParams.clientId = externalClientId.value
  queryParams.workOrderId = undefined
  queryParams.taskId = undefined
  queryParams.workstationId = undefined
  queryParams.toolId = undefined
  queryParams.moldId = undefined
  queryParams.salesOrderCode = externalSalesOrderCode.value
  queryParams.purchaseOrderCode = undefined
  queryParams.lotNumber = undefined
  queryParams.qualityStatus = undefined
  queryParams.produceDate = undefined
  queryParams.expireDate = undefined
  queryParams.receiptDate = undefined
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

const externalClientId = ref<number | undefined>() // 记录外部传入的 clientId
const externalVendorId = ref<number | undefined>() // 记录外部传入的 vendorId
const externalSalesOrderCode = ref<string | undefined>() // 记录外部传入的 salesOrderCode

/** 拼装 el-alert 提示文字 */
const alertTitle = computed(() => {
  const parts: string[] = []
  if (externalClientId.value != null) {
    parts.push('客户')
  }
  if (externalVendorId.value != null) {
    parts.push('供应商')
  }
  if (externalSalesOrderCode.value != null) {
    parts.push('销售订单')
  }
  return `已按${parts.join('/')}预过滤`
})

/** 是否显示 alert 提示 */
const showAlert = computed(() => {
  return (
    externalClientId.value != null ||
    externalVendorId.value != null ||
    externalSalesOrderCode.value != null
  )
})

/**
 * 打开弹窗
 * @param selectedIds 已选 ID，用于预选高亮
 * @param itemId 默认过滤的物料 ID
 * @param clientId 默认过滤的客户 ID
 * @param vendorId 默认过滤的供应商 ID
 * @param salesOrderCode 默认过滤的销售订单编号
 */
const open = async (
  selectedIds?: number[],
  itemId?: number,
  clientId?: number,
  vendorId?: number,
  salesOrderCode?: string
) => {
  dialogVisible.value = true
  externalClientId.value = clientId
  externalVendorId.value = vendorId
  externalSalesOrderCode.value = salesOrderCode
  // 重置查询条件 + 页码
  queryParams.code = undefined
  queryParams.itemId = itemId ?? undefined
  queryParams.vendorId = vendorId ?? undefined
  queryParams.clientId = clientId ?? undefined
  queryParams.workOrderId = undefined
  queryParams.taskId = undefined
  queryParams.workstationId = undefined
  queryParams.toolId = undefined
  queryParams.moldId = undefined
  queryParams.salesOrderCode = salesOrderCode ?? undefined
  queryParams.purchaseOrderCode = undefined
  queryParams.lotNumber = undefined
  queryParams.qualityStatus = undefined
  queryParams.produceDate = undefined
  queryParams.expireDate = undefined
  queryParams.receiptDate = undefined
  queryParams.pageNo = 1
  // 清空上一次的选中状态
  selectedRows.value = []
  selectedRadioId.value = undefined
  currentRadioRow.value = undefined
  preSelectedIds.value = selectedIds ?? []
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
