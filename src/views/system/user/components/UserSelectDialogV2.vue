<!--
  系统用户弹窗选择器（V2，支持单选/多选）

  对齐 MdVendorSelectDialog 架构模式 + userSelect 左侧部门树
  搜索字段 & 展示字段：用户名称、用户昵称、部门、手机号码

  Props:
    multiple — true 多选（checkbox），false 单选（radio）；默认 true
  Events:
    selected(rows: UserVO[]) — 确认选择后触发，单选时数组长度为 1
  Expose:
    open(selectedIds?: number[]) — 打开弹窗，可传入已选 ID 用于预选高亮
-->
<template>
  <Dialog title="人员选择" v-model="dialogVisible" width="80%">
    <el-row :gutter="20">
      <!-- 左侧部门树 -->
      <el-col :span="5" :xs="24">
        <ContentWrap class="h-full">
          <DeptTreeSelect ref="deptTreeRef" @node-click="handleDeptNodeClick" />
        </ContentWrap>
      </el-col>
      <!-- 右侧：搜索表单 + 用户表格 -->
      <el-col :span="19" :xs="24">
        <ContentWrap>
          <el-form :inline="true" :model="queryParams" label-width="85px">
            <el-form-item label="用户名称">
              <el-input
                v-model="queryParams.username"
                placeholder="请输入用户名称"
                clearable
                @keyup.enter="handleQuery"
                class="!w-220px"
              />
            </el-form-item>
            <el-form-item label="手机号码">
              <el-input
                v-model="queryParams.mobile"
                placeholder="请输入手机号码"
                clearable
                @keyup.enter="handleQuery"
                class="!w-220px"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="queryParams.status"
                placeholder="请选择状态"
                clearable
                class="!w-220px"
              >
                <el-option
                  v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
            <el-table-column label="用户名称" align="center" prop="username" width="150" />
            <el-table-column label="用户昵称" align="left" prop="nickname" min-width="150" />
            <el-table-column label="部门" align="center" prop="deptName" width="150" />
            <el-table-column label="手机号码" align="center" prop="mobile" width="130" />
            <el-table-column label="状态" align="center" prop="status" width="80">
              <template #default="scope">
                <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
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
      </el-col>
    </el-row>
    <template #footer>
      <el-button type="primary" @click="confirmSelect">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as UserApi from '@/api/system/user'
import DeptTreeSelect from '@/views/system/dept/components/DeptTreeSelect.vue'

defineOptions({ name: 'UserSelectDialogV2' })

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
  selected: [rows: UserApi.UserVO[]]
}>()

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<UserApi.UserVO[]>([]) // 用户列表
const total = ref(0) // 总条数

// ==================== 部门树 ====================
const deptTreeRef = ref() // 部门树 Ref

/** 部门节点点击 */
const handleDeptNodeClick = (deptId: number | undefined) => {
  queryParams.deptId = deptId
  handleQuery()
}

// ==================== 选中状态 ====================
const tableRef = ref() // 表格 Ref
const selectedRows = ref<UserApi.UserVO[]>([]) // 多选模式：选中行
const selectedRadioId = ref<number>() // 单选模式：选中 ID
const currentRadioRow = ref<UserApi.UserVO>() // 单选模式：选中行对象
const preSelectedIds = ref<number[]>([]) // 打开弹窗时传入的已选 ID

/** 多选：checkbox 变化 */
const handleSelectionChange = (rows: UserApi.UserVO[]) => {
  if (props.multiple) {
    selectedRows.value = rows
  }
}

/** 单选：radio 变化 */
const handleRadioChange = (row: UserApi.UserVO) => {
  currentRadioRow.value = row
}

/** 单击行：单选模式下点击整行即选中（降低操作成本），多选不处理（避免和 dblclick 冲突） */
const handleRowClick = (row: UserApi.UserVO) => {
  if (props.multiple) {
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
}

/** 双击行：多选模式切换勾选，单选模式直接确认 */
const handleRowDblClick = (row: UserApi.UserVO) => {
  if (props.multiple) {
    tableRef.value?.toggleRowSelection(row)
    return
  }
  selectedRadioId.value = row.id
  currentRadioRow.value = row
  confirmSelect()
}

// ==================== 用户查询 ====================
const queryParams = reactive({
  pageNo: 1, // 页码
  pageSize: 10, // 每页条数
  username: undefined as string | undefined, // 用户名称
  mobile: undefined as string | undefined, // 手机号码
  status: CommonStatusEnum.ENABLE as number | undefined, // 状态：默认只查启用
  deptId: undefined as number | undefined // 部门 ID（从左侧树选择）
})

/** 查询用户列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await UserApi.getUserPage(queryParams)
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
  queryParams.username = undefined
  queryParams.mobile = undefined
  queryParams.status = CommonStatusEnum.ENABLE
  queryParams.deptId = undefined
  // 清空部门树选中
  deptTreeRef.value?.reset()
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
  queryParams.username = undefined
  queryParams.mobile = undefined
  queryParams.status = CommonStatusEnum.ENABLE
  queryParams.deptId = undefined
  queryParams.pageNo = 1
  // 清空上一次的选中状态
  selectedRows.value = []
  selectedRadioId.value = undefined
  currentRadioRow.value = undefined
  preSelectedIds.value = selectedIds ?? []
  // 清空部门树选中 + 多选模式清空跨页缓存的勾选
  await nextTick()
  deptTreeRef.value?.reset()
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
