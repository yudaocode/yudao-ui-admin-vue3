<!--
  群弹窗选择器（支持单选/多选）

  对齐 UserSelectDialogV2 架构模式
  搜索字段 & 展示字段：群名称、群主、成员数、群状态

  Props:
    multiple — true 多选（checkbox），false 单选（radio）；默认 true
  Events:
    selected(rows: ImManagerGroupVO[]) — 确认选择后触发，单选时数组长度为 1
  Expose:
    open(selectedIds?: number[]) — 打开弹窗，可传入已选 ID 用于预选高亮
-->
<template>
  <Dialog title="群选择" v-model="dialogVisible" width="70%">
    <ContentWrap>
      <el-form :inline="true" :model="queryParams" label-width="68px">
        <el-form-item label="群名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入群名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-220px"
          />
        </el-form-item>
        <el-form-item label="群状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择群状态"
            clearable
            class="!w-220px"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.IM_GROUP_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
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
        <el-table-column label="编号" align="center" prop="id" width="100" />
        <el-table-column label="头像" align="center" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="32">
              {{ row.name?.charAt(0) ?? '?' }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="群名称" align="left" prop="name" min-width="160" />
        <el-table-column label="群主" align="center" min-width="160">
          <template #default="{ row }">
            <span>{{ row.ownerNickname || '-' }}</span>
            <span class="text-gray-400 ml-5px">({{ row.ownerUserId }})</span>
          </template>
        </el-table-column>
        <el-table-column label="成员数" align="center" prop="memberCount" width="90" />
        <el-table-column label="群状态" align="center" prop="status" width="100">
          <template #default="{ row }">
            <dict-tag :type="DICT_TYPE.IM_GROUP_STATUS" :value="row.status" />
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ManagerGroupApi from '@/api/im/manager/group'

defineOptions({ name: 'GroupSelectDialog' })

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
  selected: [rows: ManagerGroupApi.ImManagerGroupVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<ManagerGroupApi.ImManagerGroupVO[]>([]) // 群列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRows = ref<ManagerGroupApi.ImManagerGroupVO[]>([]) // 多选模式：选中行
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<ManagerGroupApi.ImManagerGroupVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: ManagerGroupApi.ImManagerGroupVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: ManagerGroupApi.ImManagerGroupVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中（降低操作成本），多选不处理（避免和 dblclick 冲突） */
const handleRowClick = (row: ManagerGroupApi.ImManagerGroupVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选模式切换勾选，单选模式直接确认 */
const handleRowDblClick = (row: ManagerGroupApi.ImManagerGroupVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
  confirmSelect()
}

// ==================== 群查询 ====================
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  name: undefined as string | undefined,
  status: undefined as number | undefined
})

/** 查询群列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ManagerGroupApi.getManagerGroupPage(queryParams)
    list.value = data.list
    total.value = data.total
    await nextTick()
    await applyPreSelection()
  } finally {
    loading.value = false
  }
}

/** 恢复预选状态：当前页命中直接复用 row，否则单选时调单条详情接口补齐（防已选群不在第一页时确认报"请选择"） */
const applyPreSelection = async () => {
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
    return
  }
  const targetId = preSelectedIds.value[0]
  const match = list.value.find((row) => row.id === targetId)
  if (match) {
    selectedRadioId.value = match.id
    currentRadioRow.value = match
    return
  }
  // 已选群不在当前页可见范围 → 走详情接口补齐，让 currentRadioRow 至少有 id + 名字给 confirmSelect 用
  try {
    const detail = await ManagerGroupApi.getManagerGroup(targetId)
    if (detail) {
      selectedRadioId.value = detail.id
      currentRadioRow.value = detail
    }
  } catch (e) {
    console.warn('[GroupSelectDialog] 预选群详情拉取失败', { targetId }, e)
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置查询条件 */
const resetQuery = () => {
  queryParams.name = undefined
  queryParams.status = undefined
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
  // 二次打开复位查询条件 + 选中状态，避免继承上次上下文
  queryParams.name = undefined
  queryParams.status = undefined
  queryParams.pageNo = 1
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
/* :deep 穿透 el-radio 内部 label 元素，让单选只渲染圆圈不渲染文字 */
.radio-no-label {
  :deep(.el-radio__label) {
    display: none;
  }
}
</style>
