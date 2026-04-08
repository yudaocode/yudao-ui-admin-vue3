<!--
  MES 到货通知单行弹窗选择器（单选模式）

  Props:
    noticeId — 到货通知单编号（必传，按此筛选行数据）
  Events:
    selected(rows: WmArrivalNoticeLineVO[]) — 确认选择后触发，数组长度为 1
  Expose:
    open(selectedIds?: number[]) — 打开弹窗，可传入已选 ID 用于预选高亮
-->
<template>
  <Dialog title="到货通知单行选择" v-model="dialogVisible" width="70%">
    <ContentWrap>
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        row-key="id"
        highlight-current-row
        @row-click="handleRowClick"
        @row-dblclick="handleRowDblClick"
      >
        <!-- 单选：radio -->
        <el-table-column width="50" align="center">
          <template #default="{ row }">
            <el-radio
              v-model="selectedRadioId"
              :value="row.id"
              class="radio-no-label"
              @change="handleRadioChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="物料编码" align="center" prop="itemCode" width="120" />
        <el-table-column label="物料名称" align="center" prop="itemName" min-width="150" />
        <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
        <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
        <el-table-column label="到货数量" align="center" prop="arrivalQuantity" width="100" />
        <el-table-column label="是否检验" align="center" prop="iqcCheckFlag" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.iqcCheckFlag ? 'success' : 'info'" size="small">
              {{ scope.row.iqcCheckFlag ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="合格数量" align="center" prop="qualifiedQuantity" width="100" />
        <el-table-column label="检验单号" align="center" prop="iqcCode" width="140" />
        <el-table-column label="备注" align="center" prop="remark" min-width="120" />
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
import { WmArrivalNoticeLineApi, WmArrivalNoticeLineVO } from '@/api/mes/wm/arrivalnotice/line'

defineOptions({ name: 'WmArrivalNoticeLineSelectDialog' })

const props = defineProps<{
  noticeId?: number // 到货通知单编号
}>()

const message = useMessage()
const emit = defineEmits<{
  selected: [rows: WmArrivalNoticeLineVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<WmArrivalNoticeLineVO[]>([]) // 列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<WmArrivalNoticeLineVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 单选：radio 变化 */
const handleRadioChange = (row: WmArrivalNoticeLineVO) => {
  currentRadioRow.value = row
}

/** 单击行：点击整行即选中 */
const handleRowClick = (row: WmArrivalNoticeLineVO) => {
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：直接确认 */
const handleRowDblClick = (row: WmArrivalNoticeLineVO) => {
  selectedRadioId.value = row.id
  currentRadioRow.value = row
  confirmSelect()
}

// ==================== 查询 ====================
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  noticeId: undefined as number | undefined
})

/** 查询列表 */
const getList = async () => {
  if (!props.noticeId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    queryParams.noticeId = props.noticeId
    const data = await WmArrivalNoticeLineApi.getArrivalNoticeLinePage(queryParams)
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
  const match = list.value.find((row) => preSelectedIds.value.includes(row.id))
  if (match) {
    selectedRadioId.value = match.id
    currentRadioRow.value = match
  }
}

/** 确认选择 */
const confirmSelect = () => {
  if (!currentRadioRow.value) {
    message.warning('请选择一条数据')
    return
  }
  emit('selected', [currentRadioRow.value])
  dialogVisible.value = false
}

// ==================== 打开弹窗 ====================

/** 打开弹窗，可传入已选 ID 用于预选高亮 */
const open = async (selectedIds?: number[]) => {
  dialogVisible.value = true
  queryParams.pageNo = 1
  // 清空上一次的选中状态
  selectedRadioId.value = undefined
  currentRadioRow.value = undefined
  preSelectedIds.value = selectedIds ?? []
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
