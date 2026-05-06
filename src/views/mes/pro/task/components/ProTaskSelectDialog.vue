<!--
  MES 生产任务弹窗选择器（支持单选/多选）

  Props:
    multiple — true 多选（checkbox），false 单选（radio）；默认 true
  Events:
    selected(rows: ProTaskVO[]) — 确认选择后触发，单选时数组长度为 1
  Expose:
    open(selectedIds?: number[], workOrderId?: number) — 打开弹窗，可传入已选 ID 和工单 ID 用于预选／过滤

  支持通过 statuses prop 传入状态列表，后端 IN 查询，只展示指定状态的任务
-->
<template>
  <Dialog title="生产任务选择" v-model="dialogVisible" width="80%">
    <ContentWrap>
      <el-alert
        v-if="statuses?.length"
        :title="`仅展示状态为【${statuses!.map((s) => getDictLabel(DICT_TYPE.MES_PRO_TASK_STATUS, s)).join('、')}】的任务`"
        type="info"
        :closable="false"
        show-icon
        class="!mb-10px"
      />
      <el-form :inline="true" :model="queryParams" label-width="100px">
        <el-form-item label="所属工序">
          <ProProcessSelect
            v-model="queryParams.processId"
            placeholder="请选择工序"
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
        <el-form-item label="工作站">
          <MdWorkstationSelect
            v-model="queryParams.workstationId"
            placeholder="请选择工作站"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="任务编号">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入任务编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleQuery"
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
    <!-- 数据表格：单选 radio / 多选 checkbox 统一在一个 table 内 -->
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
        <el-table-column label="任务编号" align="center" prop="code" width="180" />
        <el-table-column label="任务名称" align="left" prop="name" min-width="140" />
        <el-table-column label="工作站编码" align="center" prop="workstationCode" width="140" />
        <el-table-column label="工作站名称" align="center" prop="workstationName" width="140" />
        <el-table-column label="工序" align="center" prop="processName" width="120" />
        <el-table-column label="是否质检" align="center" prop="checkFlag" width="100">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="scope.row.checkFlag" />
          </template>
        </el-table-column>
        <el-table-column label="物料编码" align="center" prop="itemCode" width="140" />
        <el-table-column label="物料名称" align="center" prop="itemName" width="140" />
        <el-table-column label="规格型号" align="center" prop="itemSpecification" width="120" />
        <el-table-column label="排产数量" align="center" prop="quantity" width="100" />
        <el-table-column label="已生产数量" align="center" prop="producedQuantity" width="110" />
        <el-table-column label="开始生产时间" align="center" prop="startTime" width="170">
          <template #default="scope">
            <span>{{ formatDate(scope.row.startTime, 'YYYY-MM-DD HH:mm') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生产时长" align="center" prop="duration" width="100" />
        <el-table-column label="预计完成时间" align="center" prop="endTime" width="170">
          <template #default="scope">
            <span>{{ formatDate(scope.row.endTime, 'YYYY-MM-DD HH:mm') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="任务状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.MES_PRO_TASK_STATUS" :value="scope.row.status" />
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
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { ProTaskApi, ProTaskVO } from '@/api/mes/pro/task'
import ProProcessSelect from '@/views/mes/pro/process/components/ProProcessSelect.vue'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import MdWorkstationSelect from '@/views/mes/md/workstation/components/MdWorkstationSelect.vue'

defineOptions({ name: 'ProTaskSelectDialog' })

const props = withDefaults(
  defineProps<{
    multiple?: boolean // true 多选（checkbox），false 单选（radio）
    statuses?: number[] // 可选：任务状态列表（IN 查询），仅展示这些状态的任务
  }>(),
  {
    multiple: true
  }
)

const message = useMessage()
const emit = defineEmits<{
  selected: [rows: ProTaskVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<ProTaskVO[]>([]) // 任务列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRows = ref<ProTaskVO[]>([]) // 多选模式：选中行
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<ProTaskVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: ProTaskVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: ProTaskVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中（降低操作成本），多选不处理（避免和 dblclick 冲突） */
const handleRowClick = (row: ProTaskVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选模式切换勾选，单选模式直接确认 */
const handleRowDblClick = (row: ProTaskVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
  confirmSelect()
}

// ==================== 任务查询 ====================
const queryParams = reactive({
  pageNo: 1, // 页码
  pageSize: 10, // 每页条数
  code: undefined as string | undefined, // 任务编号
  name: undefined as string | undefined, // 任务名称
  processId: undefined as number | undefined, // 所属工序
  workOrderId: undefined as number | undefined, // 生产工单
  workstationId: undefined as number | undefined, // 工作站
  statuses: undefined as number[] | undefined // 任务状态列表（IN 查询）
})

/** 查询任务列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProTaskApi.getTaskPage(queryParams)
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
  queryParams.processId = undefined
  queryParams.workOrderId = undefined
  queryParams.workstationId = externalWorkstationId.value // 保持外部传入的工位过滤
  queryParams.statuses = props.statuses // 保持 props 传入的状态过滤
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

const externalWorkstationId = ref<number | undefined>() // 记录外部传入的 workstationId，用于 resetQuery 时保持过滤条件

/** 打开弹窗，可传入已选 ID 用于预选高亮，workOrderId / workstationId 用于默认过滤 */
const open = async (selectedIds?: number[], workOrderId?: number, workstationId?: number) => {
  dialogVisible.value = true
  externalWorkstationId.value = workstationId
  // 重置查询条件 + 页码，避免二次打开继承上次过滤上下文
  queryParams.code = undefined
  queryParams.name = undefined
  queryParams.processId = undefined
  queryParams.workOrderId = workOrderId ?? undefined // 传入 workOrderId 则默认按工单过滤
  queryParams.workstationId = workstationId ?? undefined // 传入 workstationId 则默认按工位过滤
  queryParams.statuses = props.statuses // 固定状态过滤条件（从 props 传入）
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
