<!--
  MES 点检保养方案弹窗选择器（支持单选/多选）

  Props:
    multiple — true 多选（checkbox），false 单选（radio）；默认 true
  Events:
    selected(rows: DvCheckPlanVO[]) — 确认选择后触发，单选时数组长度为 1
  Expose:
    open(selectedIds?: number[]) — 打开弹窗，可传入已选 ID 用于预选高亮
-->
<template>
  <Dialog title="点检方案选择" v-model="dialogVisible" width="70%">
    <ContentWrap>
      <el-alert
        v-if="type != null || status != null"
        :title="alertTitle"
        type="info"
        :closable="false"
        show-icon
        class="!mb-10px"
      />
      <el-form :inline="true" :model="queryParams" label-width="85px">
        <el-form-item label="计划编号">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入计划编号"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="计划名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入计划名称"
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
        <el-table-column label="计划编码" align="center" prop="code" width="200" />
        <el-table-column label="计划名称" align="left" prop="name" min-width="150" />
        <el-table-column label="计划类型" align="center" prop="type" width="120">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="scope.row.type" />
          </template>
        </el-table-column>
        <el-table-column
          label="开始日期"
          align="center"
          prop="startDate"
          :formatter="dateFormatter2"
          width="120"
        />
        <el-table-column
          label="结束日期"
          align="center"
          prop="endDate"
          :formatter="dateFormatter2"
          width="120"
        />
        <el-table-column label="频率" align="center" width="120">
          <template #default="scope">
            {{ scope.row.cycleCount }}
            <dict-tag
              class="ml-4px"
              :type="DICT_TYPE.MES_DV_CYCLE_TYPE"
              :value="scope.row.cycleType"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="scope.row.status" />
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
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { dateFormatter2 } from '@/utils/formatTime'
import { DvCheckPlanApi, DvCheckPlanVO } from '@/api/mes/dv/checkplan'

defineOptions({ name: 'DvCheckPlanSelectDialog' })

const props = withDefaults(
  defineProps<{
    multiple?: boolean // true 多选（checkbox），false 单选（radio）
    type?: number // 过滤特定计划类型
    status?: number // 过滤特定状态（如已启用 = 1）
  }>(),
  {
    multiple: true
  }
)

/** 拼装 el-alert 提示文字 */
const alertTitle = computed(() => {
  const parts: string[] = []
  if (props.type != null) {
    parts.push(`类型【${getDictLabel(DICT_TYPE.MES_DV_SUBJECT_TYPE, props.type)}】`)
  }
  if (props.status != null) {
    parts.push(`状态【${getDictLabel(DICT_TYPE.MES_DV_CHECK_PLAN_STATUS, props.status)}】`)
  }
  return `仅展示${parts.join('且')}的方案`
})

const message = useMessage()
const emit = defineEmits<{
  selected: [rows: DvCheckPlanVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<DvCheckPlanVO[]>([]) // 列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRows = ref<DvCheckPlanVO[]>([]) // 多选模式：选中行
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<DvCheckPlanVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: DvCheckPlanVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: DvCheckPlanVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中（降低操作成本），多选不处理（避免和 dblclick 冲突） */
const handleRowClick = (row: DvCheckPlanVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选模式切换勾选，单选模式直接确认 */
const handleRowDblClick = (row: DvCheckPlanVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
  confirmSelect()
}

// ==================== 查询 ====================
const queryParams = reactive({
  pageNo: 1, // 页码
  pageSize: 10, // 每页条数
  code: undefined as string | undefined,
  name: undefined as string | undefined,
  type: undefined as number | undefined,
  status: undefined as number | undefined
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvCheckPlanApi.getCheckPlanPage(queryParams)
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
  queryParams.type = props.type
  queryParams.status = props.status
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
