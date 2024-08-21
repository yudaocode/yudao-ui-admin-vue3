<template>
  <Dialog v-model="dialogVisible" :appendToBody="true" title="选择商品" width="70%">
    <ContentWrap>
      <el-form
        ref="queryFormRef"
        :inline="true"
        :model="queryParams"
        class="-mb-15px"
        label-width="68px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input
            v-model="queryParams.name"
            class="!w-240px"
            clearable
            placeholder="请输入商品名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-tree-select
            v-model="queryParams.categoryId"
            :data="categoryTreeList"
            :props="defaultProps"
            check-strictly
            class="!w-240px"
            node-key="id"
            placeholder="请选择商品分类"
          />
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker
            v-model="queryParams.createTime"
            :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
            class="!w-240px"
            end-placeholder="结束日期"
            start-placeholder="开始日期"
            type="daterange"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon class="mr-5px" icon="ep:search" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon class="mr-5px" icon="ep:refresh" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="list" show-overflow-tooltip>
        <!-- 1. 多选模式（不能使用type="selection"，Element会忽略Header插槽） -->
        <el-table-column width="55" v-if="multiple">
          <template #header>
            <el-checkbox
              v-model="isCheckAll"
              :indeterminate="isIndeterminate"
              @change="handleCheckAll"
            />
          </template>
          <template #default="{ row }">
            <el-checkbox
              v-model="checkedStatus[row.id]"
              @change="(checked: boolean) => handleCheckOne(checked, row, true)"
            />
          </template>
        </el-table-column>
        <!-- 2. 单选模式 -->
        <el-table-column label="#" width="55" v-else>
          <template #default="{ row }">
            <el-radio :value="row.id" v-model="selectedSpuId" @change="handleSingleSelected(row)">
              <!-- 空格不能省略，是为了让单选框不显示label，如果不指定label不会有选中的效果 -->
              &nbsp;
            </el-radio>
          </template>
        </el-table-column>
        <el-table-column key="id" align="center" label="商品编号" prop="id" min-width="60" />
        <el-table-column label="商品图" min-width="80">
          <template #default="{ row }">
            <el-image
              :src="row.picUrl"
              class="h-30px w-30px"
              :preview-src-list="[row.picUrl]"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column label="商品名称" min-width="200" prop="name" />
        <el-table-column label="商品分类" min-width="100" prop="categoryId">
          <template #default="{ row }">
            <span>{{ categoryList?.find((c) => c.id === row.categoryId)?.name }}</span>
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
    </ContentWrap>
    <template #footer v-if="multiple">
      <el-button type="primary" @click="handleEmitChange">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { defaultProps, handleTree } from '@/utils/tree'

import * as ProductCategoryApi from '@/api/mall/product/category'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { propTypes } from '@/utils/propTypes'
import { CHANGE_EVENT } from 'element-plus'

type Spu = Required<ProductSpuApi.Spu>

/**
 * 商品表格选择对话框
 * 1. 单选模式：
 *    1.1 点击表格左侧的单选框时，结束选择，并关闭对话框
 *    1.2 再次打开时，保持选中状态
 * 2. 多选模式：
 *    2.1 点击表格左侧的多选框时，记录选中的商品
 *    2.2 切换分页时，保持商品的选中的状态
 *    2.3 点击右下角的确定按钮时，结束选择，关闭对话框
 *    2.4 再次打开时，保持选中状态
 */
defineOptions({ name: 'SpuTableSelect' })

defineProps({
  // 多选模式
  multiple: propTypes.bool.def(false)
})

// 列表的总页数
const total = ref(0)
// 列表的数据
const list = ref<Spu[]>([])
// 列表的加载中
const loading = ref(false)
// 弹窗的是否展示
const dialogVisible = ref(false)
// 查询参数
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  // 默认获取上架的商品
  tabType: 0,
  name: '',
  categoryId: null,
  createTime: []
})

/** 打开弹窗 */
const open = (spuList?: Spu[]) => {
  // 重置
  checkedSpus.value = []
  checkedStatus.value = {}
  isCheckAll.value = false
  isIndeterminate.value = false

  // 处理已选中
  if (spuList && spuList.length > 0) {
    checkedSpus.value = [...spuList]
    checkedStatus.value = Object.fromEntries(spuList.map((spu) => [spu.id, true]))
  }

  dialogVisible.value = true
  resetQuery()
}
// 提供 open 方法，用于打开弹窗
defineExpose({ open })

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ProductSpuApi.getSpuPage(queryParams.value)
    list.value = data.list
    total.value = data.total
    // checkbox绑定undefined会有问题，需要给一个bool值
    list.value.forEach(
      (spu) => (checkedStatus.value[spu.id] = checkedStatus.value[spu.id] || false)
    )
    // 计算全选框状态
    calculateIsCheckAll()
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.value = {
    pageNo: 1,
    pageSize: 10,
    // 默认获取上架的商品
    tabType: 0,
    name: '',
    categoryId: null,
    createTime: []
  }
  getList()
}

// 是否全选
const isCheckAll = ref(false)
// 全选框是否处于中间状态：不是全部选中 && 任意一个选中
const isIndeterminate = ref(false)
// 选中的商品
const checkedSpus = ref<Spu[]>([])
// 选中状态：key为商品ID，value为是否选中
const checkedStatus = ref<Record<string, boolean>>({})

// 选中的商品 spuId
const selectedSpuId = ref()
/** 单选中时触发 */
const handleSingleSelected = (spu: Spu) => {
  emits(CHANGE_EVENT, spu)
  // 关闭弹窗
  dialogVisible.value = false
  // 记住上次选择的ID
  selectedSpuId.value = spu.id
}

/** 多选完成 */
const handleEmitChange = () => {
  // 关闭弹窗
  dialogVisible.value = false
  emits(CHANGE_EVENT, [...checkedSpus.value])
}

/** 确认选择时的触发事件 */
const emits = defineEmits<{
  change: [spu: Spu | Spu[] | any]
}>()

/** 全选/全不选 */
const handleCheckAll = (checked: boolean) => {
  isCheckAll.value = checked
  isIndeterminate.value = false

  list.value.forEach((spu) => handleCheckOne(checked, spu, false))
}

/**
 * 选中一行
 * @param checked 是否选中
 * @param spu 商品
 * @param isCalcCheckAll 是否计算全选
 */
const handleCheckOne = (checked: boolean, spu: Spu, isCalcCheckAll: boolean) => {
  if (checked) {
    checkedSpus.value.push(spu)
    checkedStatus.value[spu.id] = true
  } else {
    const index = findCheckedIndex(spu)
    if (index > -1) {
      checkedSpus.value.splice(index, 1)
      checkedStatus.value[spu.id] = false
      isCheckAll.value = false
    }
  }

  // 计算全选框状态
  if (isCalcCheckAll) {
    calculateIsCheckAll()
  }
}

// 查找商品在已选中商品列表中的索引
const findCheckedIndex = (spu: Spu) => checkedSpus.value.findIndex((item) => item.id === spu.id)

// 计算全选框状态
const calculateIsCheckAll = () => {
  isCheckAll.value = list.value.every((spu) => checkedStatus.value[spu.id])
  // 计算中间状态：不是全部选中 && 任意一个选中
  isIndeterminate.value = !isCheckAll.value && list.value.some((spu) => checkedStatus.value[spu.id])
}

// 分类列表
const categoryList = ref()
// 分类树
const categoryTreeList = ref()
/** 初始化 **/
onMounted(async () => {
  await getList()
  // 获得分类树
  categoryList.value = await ProductCategoryApi.getCategoryList({})
  categoryTreeList.value = handleTree(categoryList.value, 'id', 'parentId')
})
</script>
