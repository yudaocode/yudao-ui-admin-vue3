<!-- TODO @AI：这些组件，已经有了，你找下 -->
<template>
  <el-dialog v-model="dialogVisible" title="选择工作站" width="1000px" @close="handleClose">
    <el-form :inline="true" :model="queryParams" class="mb-10px">
      <el-form-item label="工作站编号">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入工作站编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="工作站名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入工作站名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-5px" /> 重置 </el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="list"
      @row-click="handleRowClick"
      highlight-current-row
      max-height="400px"
    >
      <el-table-column label="工作站编号" prop="code" width="150" />
      <el-table-column label="工作站名称" prop="name" width="200" />
      <el-table-column label="车间" prop="workshopName" width="150" />
      <el-table-column label="状态" prop="status" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { WorkstationApi } from '@/api/mes/md/workstation'

defineOptions({ name: 'WorkstationSelect' })

const emit = defineEmits(['select'])

const dialogVisible = ref(false)
const loading = ref(false)
const list = ref([])
const total = ref(0)
const selectedRow = ref(null)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined,
  name: undefined
})

const open = () => {
  dialogVisible.value = true
  getList()
}

const handleClose = () => {
  dialogVisible.value = false
  selectedRow.value = null
}

const getList = async () => {
  loading.value = true
  try {
    const data = await WorkstationApi.getWorkstationPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryParams.code = undefined
  queryParams.name = undefined
  handleQuery()
}

const handleRowClick = (row: any) => {
  selectedRow.value = row
}

const handleConfirm = () => {
  if (!selectedRow.value) {
    return
  }
  emit('select', {
    workstationId: selectedRow.value.id,
    workstationCode: selectedRow.value.code,
    workstationName: selectedRow.value.name
  })
  handleClose()
}

defineExpose({ open })
</script>
