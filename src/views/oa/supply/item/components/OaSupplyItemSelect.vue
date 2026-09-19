<template>
  <Dialog v-model="dialogVisible" title="选择办公用品" width="850px">
    <!-- 搜索工作栏 -->
    <el-form :inline="true" :model="queryParams" class="-mb-15px">
      <el-form-item label="物品名称">
        <el-input
          v-model="queryParams.name"
          clearable
          placeholder="请输入物品名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
      </el-form-item>
    </el-form>
    <!-- 可选物品 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column label="物品名称" prop="name" min-width="150" />
      <el-table-column label="规格型号" prop="model" min-width="110" />
      <el-table-column label="计量单位" prop="unit" width="90" />
      <el-table-column label="管理类型" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_SUPPLY_MANAGE_TYPE" :value="row.manageType" />
        </template>
      </el-table-column>
      <el-table-column label="库存数量" prop="stockQuantity" width="95" />
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleSelect(row)">选择</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList"
    />
  </Dialog>
</template>

<script setup lang="ts">
import * as SupplyItemApi from '@/api/oa/supply/item'
import type { SupplyItemVO } from '@/api/oa/supply/item'
import { DICT_TYPE } from '@/utils/dict'

defineOptions({ name: 'OaSupplyItemSelect' })

const dialogVisible = ref(false) // 弹窗是否展示
const loading = ref(false) // 列表加载中
const list = ref<SupplyItemVO[]>([]) // 物品列表
const total = ref(0) // 列表总数
const queryParams = reactive({ pageNo: 1, pageSize: 10, name: '' }) // 查询条件
const emit = defineEmits<{ select: [item: SupplyItemVO] }>() // 选择结果

/** 打开弹窗 */
function open() {
  dialogVisible.value = true
  queryParams.name = ''
  handleQuery()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询可选物品 */
async function getList() {
  loading.value = true
  try {
    const data = await SupplyItemApi.getSupplyItemSelectPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1
  getList()
}

/** 选择物品 */
function handleSelect(item: SupplyItemVO) {
  emit('select', item)
  dialogVisible.value = false
}
</script>
