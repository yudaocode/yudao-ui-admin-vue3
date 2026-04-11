<template>
  <Dialog v-model="dialogVisible" :appendToBody="true" :title="dialogTitle" width="70%">
    <ContentWrap>
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
            :data="categoryList"
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
      <el-table
        ref="spuListRef"
        v-loading="loading"
        :data="list"
        :expand-row-keys="expandRowKeys"
        row-key="id"
        @expand-change="expandChange"
        @selection-change="selectSpu"
      >
        <el-table-column v-if="isSelectSku" type="expand" width="30">
          <template #default>
            <SkuList
              v-if="isExpand"
              ref="skuListRef"
              :isComponent="true"
              :isDetail="true"
              :prop-form-data="spuData"
              :property-list="propertyList"
              @selection-change="selectSku"
            />
          </template>
        </el-table-column>
        <el-table-column type="selection" width="55" />
        <el-table-column key="id" align="center" label="商品编号" prop="id" />
        <el-table-column label="商品图" min-width="80">
          <template #default="{ row }">
            <el-image :src="row.picUrl" class="h-30px w-30px" @click="imagePreview(row.picUrl)" />
          </template>
        </el-table-column>
        <el-table-column
          :show-overflow-tooltip="true"
          label="商品名称"
          min-width="300"
          prop="name"
        />
        <el-table-column align="center" label="商品售价" min-width="90" prop="price">
          <template #default="{ row }">
            {{ formatToFraction(row.price) }}
          </template>
        </el-table-column>
        <el-table-column align="center" label="销量" min-width="90" prop="salesCount" />
        <el-table-column align="center" label="库存" min-width="90" prop="stock" />
        <el-table-column align="center" label="排序" min-width="70" prop="sort" />
        <el-table-column
          :formatter="dateFormatter"
          align="center"
          label="创建时间"
          prop="createTime"
          width="180"
        />
      </el-table>
      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>
    <template #footer>
      <el-button type="primary" @click="confirm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { getPropertyList, PropertyAndValues, SkuList } from '@/views/mall/product/spu/components'
import { ElTable } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import { createImageViewer } from '@/components/ImageViewer'
import { floatToFixed2, formatToFraction } from '@/utils'
import { defaultProps, handleTree } from '@/utils/tree'

import * as ProductCategoryApi from '@/api/mall/product/category'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'PromotionSpuSelect' })

const props = defineProps({
  // 默认不需要（不需要的情况下只返回 spu，需要的情况下返回 选中的 spu 和 sku 列表）
  // 其它活动需要选择商品和商品属性导入此组件即可，需添加组件属性 :isSelectSku='true'
  isSelectSku: propTypes.bool.def(false), // 是否需要选择 sku 属性
  radio: propTypes.bool.def(false) // 是否单选 sku
})

const message = useMessage() // 消息弹窗
const total = ref(0) // 列表的总页数
const list = ref<any[]>([]) // 列表的数据
const loading = ref(false) // 列表的加载中
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const queryParams = ref({
  pageNo: 1,
  pageSize: 10,
  tabType: 0, // 默认获取上架的商品
  name: '',
  categoryId: null,
  createTime: []
}) // 查询参数
const propertyList = ref<PropertyAndValues[]>([]) // 商品属性列表
const spuListRef = ref<InstanceType<typeof ElTable>>()
const skuListRef = ref<InstanceType<typeof SkuList>>() // 商品属性选择 Ref
const spuData = ref<ProductSpuApi.Spu>() // 商品详情
const isExpand = ref(false) // 控制 SKU 列表显示
const expandRowKeys = ref<number[]>() // 控制展开行需要设置 row-key 属性才能使用，该属性为展开行的 keys 数组。

//============ 商品选择相关 ============
const selectedSpuId = ref<number>(0) // 选中的商品 spuId
const selectedSkuIds = ref<number[]>([]) // 选中的商品 skuIds
const selectSku = (val: ProductSpuApi.Sku[]) => {
  const skuTable = skuListRef.value?.getSkuTableRef()
  if (selectedSpuId.value === 0) {
    message.warning('请先选择商品再选择相应的规格！！！')
    skuTable?.clearSelection()
    return
  }
  if (val.length === 0) {
    selectedSkuIds.value = []
    return
  }
  if (props.radio) {
    // 只选择一个
    selectedSkuIds.value = [val.map((sku) => sku.id!)[0]]
    // 如果大于1个
    if (val.length > 1) {
      // 清空选择
      skuTable?.clearSelection()
      // 变更为最后一次选择的
      skuTable?.toggleRowSelection(val.pop(), true)
      return
    }
  } else {
    selectedSkuIds.value = val.map((sku) => sku.id!)
  }
}
const selectSpu = (val: ProductSpuApi.Spu[]) => {
  if (val.length === 0) {
    selectedSpuId.value = 0
    return
  }
  // 只选择一个
  selectedSpuId.value = val.map((spu) => spu.id!)[0]
  // 切换选择 spu 如果有选择的 sku 则清空,确保选择的 sku 是对应的 spu 下面的
  if (selectedSkuIds.value.length > 0) {
    selectedSkuIds.value = []
  }
  // 如果大于1个
  if (val.length > 1) {
    // 清空选择
    spuListRef.value?.clearSelection()
    // 变更为最后一次选择的
    spuListRef.value?.toggleRowSelection(val.pop(), true)
    return
  }
  expandChange(val[0], val)
}

// 计算商品属性
const expandChange = async (row: ProductSpuApi.Spu, expandedRows?: ProductSpuApi.Spu[]) => {
  // 判断需要展开的 spuId === 选择的 spuId。如果选择了 A 就展开 A 的 skuList。如果选择了 A 手动展开 B 则阻断
  // 目的防止误选 sku
  if (selectedSpuId.value !== 0) {
    if (row.id !== selectedSpuId.value) {
      message.warning('你已选择商品请先取消')
      expandRowKeys.value = [selectedSpuId.value]
      return
    }
    // 如果已展开 skuList 则选择此对应的 spu 不需要重新获取渲染 skuList
    if (isExpand.value && spuData.value?.id === row.id) {
      return
    }
  }
  spuData.value = {}
  propertyList.value = []
  isExpand.value = false
  if (expandedRows?.length === 0) {
    // 如果展开个数为 0
    expandRowKeys.value = []
    return
  }
  // 获取 SPU 详情
  const res = (await ProductSpuApi.getSpu(row.id as number)) as ProductSpuApi.Spu
  res.skus?.forEach((item) => {
    item.price = floatToFixed2(item.price)
    item.marketPrice = floatToFixed2(item.marketPrice)
    item.costPrice = floatToFixed2(item.costPrice)
    item.firstBrokeragePrice = floatToFixed2(item.firstBrokeragePrice)
    item.secondBrokeragePrice = floatToFixed2(item.secondBrokeragePrice)
  })
  propertyList.value = getPropertyList(res)
  spuData.value = res
  isExpand.value = true
  expandRowKeys.value = [row.id!]
}

// 确认选择时的触发事件
const emits = defineEmits<{
  (e: 'confirm', spuId: number, skuIds?: number[]): void
}>()
/**
 * 确认选择返回选中的 spu 和 sku (如果需要选择sku的话)
 */
const confirm = () => {
  if (selectedSpuId.value === 0) {
    message.warning('没有选择任何商品')
    return
  }
  if (props.isSelectSku && selectedSkuIds.value.length === 0) {
    message.warning('没有选择任何商品属性')
    return
  }
  // 返回各自 id 列表
  props.isSelectSku
    ? emits('confirm', selectedSpuId.value, selectedSkuIds.value)
    : emits('confirm', selectedSpuId.value)
  // 关闭弹窗
  dialogVisible.value = false
  selectedSpuId.value = 0
  selectedSkuIds.value = []
}

/** 打开弹窗 */
const open = () => {
  dialogTitle.value = '商品选择'
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

/** 商品图预览 */
const imagePreview = (imgUrl: string) => {
  createImageViewer({
    zIndex: 99999999,
    urlList: [imgUrl]
  })
}

const categoryList = ref() // 分类树

/** 初始化 **/
onMounted(async () => {
  await getList()
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id', 'parentId')
})
</script>
