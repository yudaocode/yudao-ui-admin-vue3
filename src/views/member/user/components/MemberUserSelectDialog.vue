<!--
  会员弹窗选择器（支持单选/多选）

  Props:
    multiple — true 多选（checkbox），false 单选（radio）
  Events:
    selected(rows: UserVO[]) — 确认选择后触发
  Expose:
    open(rows: UserVO[]) — 打开弹窗并回显选中项
-->
<template>
  <Dialog v-model="dialogVisible" title="选择会员" width="900px" append-to-body>
    <!-- 搜索 -->
    <ContentWrap>
      <el-form :model="queryParams" :inline="true" class="-mb-15px" label-width="85px">
        <el-form-item label="会员昵称">
          <el-input
            v-model="queryParams.nickname"
            placeholder="请输入会员昵称"
            clearable
            class="!w-220px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="会员编号">
          <el-input-number v-model="queryParams.id" :min="1" :controls="false" class="!w-220px" />
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
    <!-- 列表 -->
    <ContentWrap>
      <el-table
        v-loading="loading"
        :data="list"
        :stripe="true"
        :show-overflow-tooltip="true"
        row-key="id"
        :highlight-current-row="!multiple"
        @row-click="handleRowClick"
        @row-dblclick="handleRowDblClick"
      >
        <el-table-column width="55" align="center">
          <template v-if="multiple" #header>
            <el-checkbox
              :model-value="allSelected"
              :indeterminate="partSelected"
              @change="(checked) => togglePage(checked === true)"
            />
          </template>
          <template #default="{ row }">
            <el-checkbox
              v-if="multiple"
              :model-value="selectedRows.has(row.id!)"
              @change="(checked) => toggleRow(row, checked === true)"
            />
            <el-radio
              v-else
              :model-value="selectedRadioId"
              :value="row.id"
              @change="() => selectRow(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="会员编号" align="center" prop="id" width="120" />
        <el-table-column label="头像" align="center" width="70">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="32" />
          </template>
        </el-table-column>
        <el-table-column label="会员昵称" prop="nickname" min-width="150" />
      </el-table>
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>
    <template #footer>
      <span v-if="multiple" class="mr-12px text-sm text-[var(--el-text-color-secondary)]"
        >已选 {{ selectedRows.size }} 位</span
      >
      <el-button type="primary" @click="confirmSelect">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as MemberApi from '@/api/member/user'

defineOptions({ name: 'MemberUserSelectDialog' })

const props = defineProps<{
  multiple?: boolean // true 多选，false 单选
}>()
const emit = defineEmits<{
  selected: [rows: MemberApi.UserVO[]]
}>()
const message = useMessage()
const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<MemberApi.UserVO[]>([]) // 会员列表
const total = ref(0) // 总条数

// ==================== 选中状态 ====================
const selectedRows = ref(new Map<number, MemberApi.UserVO>()) // 跨页选中的会员
const selectedRadioId = computed(() => selectedRows.value.keys().next().value)
const allSelected = computed(() => {
  return list.value.length > 0 && list.value.every((row) => selectedRows.value.has(row.id!))
})
const partSelected = computed(() => {
  return !allSelected.value && list.value.some((row) => selectedRows.value.has(row.id!))
})

// ==================== 会员查询 ====================
const queryParams = reactive({
  pageNo: 1, // 页码
  pageSize: 10, // 每页条数
  id: undefined as number | undefined, // 会员编号
  nickname: undefined as string | undefined // 会员昵称
})
let requestId = 0

/** 查询会员列表 */
const getList = async () => {
  const current = ++requestId
  loading.value = true
  try {
    const data = await MemberApi.getUserSelectPage(queryParams)
    if (current !== requestId) return
    list.value = data.list
    total.value = data.total
  } finally {
    if (current === requestId) loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.nickname = undefined
  queryParams.id = undefined
  handleQuery()
}

/** 选择一位会员 */
const selectRow = (row: MemberApi.UserVO) => {
  selectedRows.value = new Map([[row.id!, row]])
}

/** 勾选一位会员 */
const toggleRow = (row: MemberApi.UserVO, checked: boolean) => {
  if (checked) {
    selectedRows.value.set(row.id!, row)
  } else {
    selectedRows.value.delete(row.id!)
  }
}

/** 勾选当前页会员 */
const togglePage = (checked: boolean) => {
  list.value.forEach((row) => toggleRow(row, checked))
}

/** 点击表格行 */
const handleRowClick = (row: MemberApi.UserVO) => {
  if (!props.multiple) {
    selectRow(row)
  }
}

/** 双击表格行 */
const handleRowDblClick = (row: MemberApi.UserVO) => {
  if (props.multiple) {
    toggleRow(row, !selectedRows.value.has(row.id!))
    return
  }
  selectRow(row)
  confirmSelect()
}

/** 确认选择 */
const confirmSelect = () => {
  if (!selectedRows.value.size) {
    message.warning('请选择会员')
    return
  }
  emit('selected', Array.from(selectedRows.value.values()))
  dialogVisible.value = false
}

/** 打开弹窗 */
const open = (rows: MemberApi.UserVO[] = []) => {
  selectedRows.value = new Map(rows.map((row) => [row.id!, row]))
  queryParams.nickname = undefined
  queryParams.id = undefined
  queryParams.pageNo = 1
  dialogVisible.value = true
  getList()
}
defineExpose({ open }) // 提供 open 方法
</script>
