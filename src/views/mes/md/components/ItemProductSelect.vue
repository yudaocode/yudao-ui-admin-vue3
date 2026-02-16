<!-- MES 物料产品 弹窗选择器 -->
<template>
  <Dialog title="物料产品选择" v-model="dialogVisible" width="80%">
    <el-row :gutter="20">
      <!-- 左侧：分类树 -->
      <el-col :span="5">
        <el-input
          v-model="filterText"
          placeholder="搜索分类"
          clearable
          class="mb-12px"
          :prefix-icon="iconSearch"
        />
        <el-tree
          ref="treeRef"
          :data="itemTypeTree"
          :props="treeProps"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          default-expand-all
          highlight-current
          @node-click="handleNodeClick"
        />
      </el-col>
      <!-- 右侧：物料表格 -->
      <el-col :span="19">
        <!-- 搜索表单 -->
        <el-form :inline="true" :model="queryParams" class="mb-10px" label-width="80px">
          <el-form-item label="物料编码">
            <el-input
              v-model="queryParams.code"
              placeholder="请输入物料编码"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item label="物料名称">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入物料名称"
              clearable
              @keyup.enter="handleQuery"
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
        <!-- 数据表格 -->
        <el-table
          v-loading="loading"
          :data="list"
          :stripe="true"
          :show-overflow-tooltip="true"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="物料编码" align="center" prop="code" width="120" />
          <el-table-column label="物料名称" align="center" prop="name" min-width="120" />
          <el-table-column label="规格型号" align="center" prop="specification" />
          <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
          <el-table-column label="物料/产品" align="center" prop="itemOrProduct" width="100">
            <template #default="scope">
              {{ getItemOrProductLabel(scope.row.itemOrProduct) }}
            </template>
          </el-table-column>
          <el-table-column label="所属分类" align="center" prop="itemTypeName" width="120" />
        </el-table>
        <!-- 分页 -->
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </el-col>
    </el-row>
    <template #footer>
      <el-button type="primary" @click="confirmSelect">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { MdItemApi, MdItemVO } from '@/api/mes/md/item'
import { MdItemTypeApi, MdItemTypeVO } from '@/api/mes/md/item/type'
import { handleTree } from '@/utils/tree'
import { getItemOrProductLabel } from '@/views/mes/utils/constants'
import { Search as iconSearch } from '@element-plus/icons-vue'

defineOptions({ name: 'ItemProductSelect' })

const message = useMessage() // 消息弹窗
const emit = defineEmits<{
  selected: [rows: MdItemVO[]] // 确认选择事件
}>()

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(false) // 列表加载中
const list = ref<MdItemVO[]>([]) // 物料列表
const total = ref(0) // 总条数
const selectedRows = ref<MdItemVO[]>([]) // 选中行

// ==================== 分类树 ====================
const treeRef = ref() // 树组件 Ref
const filterText = ref('') // 分类搜索文本
const itemTypeTree = ref<MdItemTypeVO[]>([]) // 分类树数据
const treeProps = { children: 'children', label: 'name' } // 树属性配置

/** 过滤树节点 */
const filterNode = (value: string, data: MdItemTypeVO) => {
  if (!value) return true
  return data.name?.includes(value)
}

/** 监听筛选文本变化 */
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

/** 点击树节点 */
const handleNodeClick = (data: MdItemTypeVO) => {
  queryParams.itemTypeId = data.id
  handleQuery()
}

// ==================== 物料查询 ====================
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  code: undefined as string | undefined,
  name: undefined as string | undefined,
  itemTypeId: undefined as number | undefined
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await MdItemApi.getItemPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
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
  queryParams.itemTypeId = undefined
  handleQuery()
}

/** 选中变化 */
const handleSelectionChange = (rows: MdItemVO[]) => {
  selectedRows.value = rows
}

/** 确认选择 */
const confirmSelect = () => {
  if (selectedRows.value.length === 0) {
    message.warning('请至少选择一条数据')
    return
  }
  emit('selected', selectedRows.value)
  dialogVisible.value = false
}

// ==================== 打开弹窗 ====================

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true
  selectedRows.value = []
  // 加载分类树
  const typeList = await MdItemTypeApi.getItemTypeSimpleList()
  itemTypeTree.value = handleTree(typeList)
  // 加载物料列表
  await getList()
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗
</script>
