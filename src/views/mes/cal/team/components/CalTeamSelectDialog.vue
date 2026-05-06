<!--
  MES 班组弹窗选择器（支持单选/多选）

  Props:
    multiple — true 多选（checkbox），false 单选（radio）；默认 true
  Events:
    selected(rows: CalTeamVO[]) — 确认选择后触发，单选时数组长度为 1
  Expose:
    open(selectedIds?: number[]) — 打开弹窗，可传入已选 ID 用于预选高亮
-->
<template>
  <Dialog title="班组选择" v-model="dialogVisible" width="720px">
    <!-- 搜索 -->
    <ContentWrap>
      <el-form :inline="true" :model="queryParams" label-width="68px">
        <el-form-item label="班组编码">
          <el-input
            v-model="queryParams.code"
            placeholder="请输入班组编码"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="班组名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入班组名称"
            clearable
            @keyup.enter="handleQuery"
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
        <el-table-column label="班组编码" align="center" prop="code" min-width="120" />
        <el-table-column label="班组名称" align="center" prop="name" min-width="140" />
        <el-table-column label="备注" align="center" prop="remark" min-width="120" />
      </el-table>
      <!-- 分页 -->
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
import { CalTeamApi, CalTeamVO } from '@/api/mes/cal/team'

defineOptions({ name: 'CalTeamSelectDialog' })

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
  selected: [rows: CalTeamVO[]]
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const list = ref<CalTeamVO[]>([])
const total = ref(0)

// ==================== 选中状态 ====================
const tableRef = ref()
const selectedRows = ref<CalTeamVO[]>([]) // 多选：选中行
const selectedRadioId = ref<number>() // 单选：选中 ID
const currentRadioRow = ref<CalTeamVO>() // 单选：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: CalTeamVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: CalTeamVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中 */
const handleRowClick = (row: CalTeamVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选切换勾选，单选直接确认 */
const handleRowDblClick = (row: CalTeamVO) => {
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
  pageNo: 1,
  pageSize: 10,
  code: undefined as string | undefined,
  name: undefined as string | undefined
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await CalTeamApi.getTeamPage(queryParams)
    list.value = data.list
    total.value = data.total
    await nextTick()
    applyPreSelection()
  } finally {
    loading.value = false
  }
}

/** 恢复预选状态 */
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

/** 搜索 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置 */
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

/** 打开弹窗 */
const open = async (selectedIds?: number[]) => {
  dialogVisible.value = true
  queryParams.code = undefined
  queryParams.name = undefined
  queryParams.pageNo = 1
  // 清空上一次选中
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
.radio-no-label {
  :deep(.el-radio__label) {
    display: none;
  }
}
</style>
