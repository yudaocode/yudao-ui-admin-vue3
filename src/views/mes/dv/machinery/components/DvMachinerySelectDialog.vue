<!--
  MES 设备弹窗选择器（支持单选/多选）
-->
<template>
  <Dialog title="设备选择" v-model="dialogVisible" width="80%">
    <el-row :gutter="20">
      <!-- 左侧分类树 -->
      <el-col :span="4" :xs="24">
        <ContentWrap class="h-1/1">
          <MachineryTypeTree @node-click="handleTypeNodeClick" />
        </ContentWrap>
      </el-col>
      <!-- 右侧设备数据 -->
      <el-col :span="20" :xs="24">
        <ContentWrap>
          <el-form :inline="true" :model="queryParams" label-width="85px">
            <el-form-item label="设备编码">
              <el-input
                v-model="queryParams.code"
                placeholder="请输入设备编码"
                clearable
                @keyup.enter="handleQuery"
                class="!w-240px"
              />
            </el-form-item>
            <el-form-item label="设备名称">
              <el-input
                v-model="queryParams.name"
                placeholder="请输入设备名称"
                clearable
                @keyup.enter="handleQuery"
                class="!w-240px"
              />
            </el-form-item>
            <el-form-item label="所属车间">
              <el-select
                v-model="queryParams.workshopId"
                placeholder="请选择所属车间"
                clearable
                class="!w-240px"
              >
                <el-option
                  v-for="item in workshopList"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
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
            <el-table-column label="设备编码" align="center" prop="code" width="120" />
            <el-table-column label="设备名称" align="left" prop="name" min-width="120" />
            <el-table-column label="品牌" align="left" prop="brand" min-width="120" />
            <el-table-column label="规格型号" align="left" prop="specification" min-width="120" />
            <el-table-column label="所属车间" align="center" prop="workshopName" width="120" />
            <el-table-column label="设备状态" align="center" prop="status" width="100">
              <template #default="scope">
                <dict-tag :type="DICT_TYPE.MES_DV_MACHINERY_STATUS" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column
              label="创建时间"
              align="center"
              prop="createTime"
              :formatter="dateFormatter"
              width="160"
            />
          </el-table>
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
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { DvMachineryApi, DvMachineryVO } from '@/api/mes/dv/machinery'
import { MdWorkshopApi, MdWorkshopVO } from '@/api/mes/md/workstation/workshop'
import MachineryTypeTree from '../type/components/MachineryTypeTree.vue'

defineOptions({ name: 'DvMachinerySelectDialog' })

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
  selected: [rows: DvMachineryVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<DvMachineryVO[]>([]) // 设备列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRows = ref<DvMachineryVO[]>([]) // 多选模式：选中行
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<DvMachineryVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

const workshopList = ref<MdWorkshopVO[]>([]) // 车间列表

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: DvMachineryVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: DvMachineryVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中（降低操作成本），多选不处理（避免和 dblclick 冲突） */
const handleRowClick = (row: DvMachineryVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选模式切换勾选，单选模式直接确认 */
const handleRowDblClick = (row: DvMachineryVO) => {
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
  code: undefined as string | undefined, // 设备编码
  name: undefined as string | undefined, // 设备名称
  workshopId: undefined as number | undefined, // 所属车间
  machineryTypeId: undefined as number | undefined // 设备类型
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DvMachineryApi.getMachineryPage(queryParams)
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
  queryParams.workshopId = undefined
  // 不重置 machineryTypeId，保持左侧树的选中状态
  handleQuery()
}

/** 处理分类树节点点击 */
const handleTypeNodeClick = (row: any) => {
  queryParams.machineryTypeId = row?.id
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
  queryParams.workshopId = undefined
  queryParams.machineryTypeId = undefined
  queryParams.pageNo = 1
  // 清空上一次的选中状态
  selectedRows.value = []
  selectedRadioId.value = undefined
  currentRadioRow.value = undefined
  preSelectedIds.value = selectedIds ?? []

  if (workshopList.value.length === 0) {
    workshopList.value = await MdWorkshopApi.getWorkshopSimpleList()
  }

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
