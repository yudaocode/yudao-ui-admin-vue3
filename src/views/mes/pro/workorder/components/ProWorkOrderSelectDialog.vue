<!--
  MES 生产工单弹窗选择器（支持单选/多选）

  Props:
    multiple — true 多选（checkbox），false 单选（radio）；默认 true
  Events:
    selected(rows: ProWorkOrderVO[]) — 确认选择后触发，单选时数组长度为 1
  Expose:
    open(selectedIds?: number[]) — 打开弹窗，可传入已选 ID 用于预选高亮
-->
<template>
  <Dialog title="生产工单选择" v-model="dialogVisible" width="80%">
    <!-- 搜索 -->
    <ContentWrap>
      <el-alert
        v-if="type != null"
        :title="`仅展示【${getDictLabel(DICT_TYPE.MES_PRO_WORK_ORDER_TYPE, type)}】类型的工单`"
        type="info"
        :closable="false"
        show-icon
        class="!mb-10px"
      />
      <el-form :inline="true" :model="queryParams" label-width="80px">
        <el-form-item label="工单编码">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入工单编码"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="工单名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入工单名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="产品">
          <MdItemSelect v-model="queryParams.productId" placeholder="请选择产品" class="!w-240px" />
        </el-form-item>
        <el-form-item label="客户">
          <MdClientSelect
            v-model="queryParams.clientId"
            placeholder="请选择客户"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="工单状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_WORK_ORDER_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
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
        <el-table-column label="工单编码" align="center" prop="code" width="180" />
        <el-table-column label="工单名称" align="center" prop="name" min-width="200" />
        <el-table-column label="工单来源" align="center" prop="orderSourceType" width="100">
          <template #default="scope">
            <dict-tag
              :type="DICT_TYPE.MES_PRO_WORK_ORDER_SOURCE_TYPE"
              :value="scope.row.orderSourceType"
            />
          </template>
        </el-table-column>
        <el-table-column label="订单编号" align="center" prop="orderSourceCode" width="140" />
        <el-table-column label="产品编号" align="center" prop="productCode" width="120" />
        <el-table-column label="产品名称" align="center" prop="productName" min-width="200" />
        <el-table-column label="规格型号" align="center" prop="productSpecification" min-width="120" />
        <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
        <el-table-column label="工单数量" align="center" prop="quantity" width="100" />
        <el-table-column label="客户编码" align="center" prop="clientCode" width="120" />
        <el-table-column label="客户名称" align="center" prop="clientName" min-width="120" />
        <el-table-column label="工单状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          label="需求日期"
          align="center"
          prop="requestDate"
          :formatter="dateFormatter2"
          width="120"
        />
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
import { dateFormatter2 } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { ProWorkOrderApi, ProWorkOrderVO } from '@/api/mes/pro/workorder'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdClientSelect from '@/views/mes/md/client/components/MdClientSelect.vue'

defineOptions({ name: 'ProWorkOrderSelectDialog' })

const props = withDefaults(
  defineProps<{
    multiple?: boolean // true 多选（checkbox），false 单选（radio）
    status?: number // 打开弹窗时的默认状态过滤（不传则不预设）
    type?: number // 工单类型过滤（不传则不限制）
  }>(),
  {
    multiple: true
  }
)

const message = useMessage()
const emit = defineEmits<{
  selected: [rows: ProWorkOrderVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<ProWorkOrderVO[]>([]) // 工单列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRows = ref<ProWorkOrderVO[]>([]) // 多选模式：选中行
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<ProWorkOrderVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: ProWorkOrderVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: ProWorkOrderVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中（降低操作成本），多选不处理（避免和 dblclick 冲突） */
const handleRowClick = (row: ProWorkOrderVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选模式切换勾选，单选模式直接确认 */
const handleRowDblClick = (row: ProWorkOrderVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
  confirmSelect()
}

// ==================== 工单查询 ====================
const queryParams = reactive({
  pageNo: 1, // 页码
  pageSize: 10, // 每页条数
  code: undefined as string | undefined, // 工单编码
  name: undefined as string | undefined, // 工单名称
  productId: undefined as number | undefined, // 产品编号
  clientId: undefined as number | undefined, // 客户编号
  status: undefined as number | undefined, // 工单状态
  type: undefined as number | undefined // 工单类型
})

/** 查询工单列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProWorkOrderApi.getWorkOrderPage(queryParams)
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
  queryParams.name = undefined
  queryParams.productId = undefined
  queryParams.clientId = undefined
  queryParams.status = props.status
  queryParams.type = props.type
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
  queryParams.code = undefined
  queryParams.name = undefined
  queryParams.productId = undefined
  queryParams.clientId = undefined
  queryParams.status = props.status
  queryParams.type = props.type
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
