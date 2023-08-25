<template>
  <Dialog v-model="dialogVisible" :appendToBody="true" title="选择商品" width="70%">
    <el-row :gutter="20" class="mb-10px">
      <el-col :span="6">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入商品名称"
          @keyup.enter="handleQuery"
        />
      </el-col>
      <el-col :span="6">
        <el-tree-select
          v-model="queryParams.categoryId"
          :data="categoryTreeList"
          :props="defaultProps"
          check-strictly
          class="w-1/1"
          node-key="id"
          placeholder="请选择商品分类"
        />
      </el-col>
      <el-col :span="6">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-col>
      <el-col :span="6">
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-col>
    </el-row>
    <el-table ref="spuListRef" v-loading="loading" :data="list" show-overflow-tooltip>
      <el-table-column label="#" width="55">
        <template #default="{ row }">
          <el-radio :label="row.id" v-model="selectedSpuId" @change="handleSelected(row)"
            >&nbsp;</el-radio
          >
        </template>
      </el-table-column>
      <el-table-column key="id" align="center" label="商品编号" prop="id" min-width="60" />
      <el-table-column label="商品图" min-width="80">
        <template #default="{ row }">
          <el-image
            :src="row.picUrl"
            class="w-30px h-30px"
            :preview-src-list="[row.picUrl]"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column label="商品名称" min-width="200" prop="name" />
      <el-table-column label="商品分类" min-width="100" prop="categoryId">
        <template #default="{ row }">
          <span>{{ categoryList.find((c) => c.id === row.categoryId)?.name }}</span>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </Dialog>
</template>

<script lang="ts" setup>
import { ElTable } from 'element-plus'
import { defaultProps, handleTree } from '@/utils/tree'

import * as ProductCategoryApi from '@/api/mall/product/category'
import * as ProductSpuApi from '@/api/mall/product/spu'

defineOptions({ name: 'SpuTableSelect' })

const message = useMessage() // 消息弹窗
const total = ref(0) // 列表的总页数
const list = ref<any[]>([]) // 列表的数据
const loading = ref(false) // 列表的加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  tabType: 0, // 默认获取上架的商品
  name: '',
  categoryId: null,
  createTime: []
}) // 查询参数
const spuListRef = ref<InstanceType<typeof ElTable>>()

const selectedSpuId = ref() // 选中的商品 spuId

/** 选中时触发 */
const handleSelected = (row: ProductSpuApi.Spu) => {
  emits('change', row)
  // 关闭弹窗
  dialogVisible.value = false
  selectedSpuId.value = undefined
}

// 确认选择时的触发事件
const emits = defineEmits<{
  (e: 'change', spu: ProductSpuApi.Spu): void
}>()

/** 打开弹窗 */
const open = () => {
  dialogVisible.value = true
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProductSpuApi.getSpuPage(queryParams.value)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.value = {
    pageNo: 1,
    pageSize: 10,
    tabType: 0, // 默认获取上架的商品
    name: '',
    categoryId: null,
    createTime: []
  }
  getList()
}

const categoryList = ref() // 分类列表
const categoryTreeList = ref() // 分类树

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 获得分类树
  categoryList.value = await ProductCategoryApi.getCategoryList({})
  categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId')
})
</script>
