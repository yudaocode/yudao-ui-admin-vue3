<!-- TODO @AI：这些组件，已经有了，你找下 -->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择物料"
    width="1000px"
    @close="handleClose"
  >
    <el-form :inline="true" :model="queryParams" class="mb-10px">
      <el-form-item label="物料编号">
        <el-input
          v-model="queryParams.code"
          placeholder="请输入物料编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="物料名称">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入物料名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" class="mr-5px" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" class="mr-5px" /> 重置
        </el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="list"
      @row-click="handleRowClick"
      highlight-current-row
      max-height="400px"
    >
      <el-table-column label="物料编号" prop="code" width="150" />
      <el-table-column label="物料名称" prop="name" width="200" />
      <el-table-column label="规格型号" prop="specification" width="150" />
      <el-table-column label="单位" prop="unitName" width="100" />
      <el-table-column label="物料分类" prop="typeName" width="150" />
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
import { ItemApi } from '@/api/mes/md/item'

defineOptions({ name: 'ItemSelect' })

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
    const data = await ItemApi.getItemPage(queryParams)
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
    itemId: selectedRow.value.id,
    itemCode: selectedRow.value.code,
    itemName: selectedRow.value.name,
    specification: selectedRow.value.specification,
    unitName: selectedRow.value.unitName
  })
  handleClose()
}

defineExpose({ open })
</script>
