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
            @change="nodeClick"
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
        @expandChange="getPropertyList"
        @selection-change="selectSpu"
      >
        <el-table-column v-if="isSelectSku" type="expand" width="30">
          <template #default>
            <SkuList
              v-if="isExpand"
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
            <el-image :src="row.picUrl" class="w-30px h-30px" @click="imagePreview(row.picUrl)" />
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

<script lang="ts" name="SeckillActivitySpuAndSkuSelect" setup>
import { SkuList } from '@/views/mall/product/spu/components'
import { ElTable } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import { createImageViewer } from '@/components/ImageViewer'
import { formatToFraction } from '@/utils'
import { checkSelectedNode, defaultProps, handleTree } from '@/utils/tree'

import * as ProductCategoryApi from '@/api/mall/product/category'
import * as ProductSpuApi from '@/api/mall/product/spu'
import { propTypes } from '@/utils/propTypes'

const props = defineProps({
  // 默认不需要（不需要的情况下只返回 spu，需要的情况下返回 选中的 spu 和 sku 列表）
  // 其它活动需要选择商品和商品属性导入此组件即可，需添加组件属性 :isSelectSku='true'
  isSelectSku: propTypes.bool.def(false) // 是否需要选择 sku 属性
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
const propertyList = ref([]) // 商品属性列表
const spuListRef = ref<InstanceType<typeof ElTable>>()
const spuData = ref<ProductSpuApi.Spu | {}>() // 商品详情
const isExpand = ref(false) // 控制 SKU 列表显示
const expandRowKeys = ref<number[]>() // 控制展开行需要设置 row-key 属性才能使用，该属性为展开行的 keys 数组。
// 计算商品属性
const getPropertyList = async (row: ProductSpuApi.Spu, expandedRows: ProductSpuApi.Spu[]) => {
  spuData.value = {}
  propertyList.value = []
  isExpand.value = false
  // 如果展开个数为 0
  if (expandedRows.length === 0) {
    expandRowKeys.value = []
    return
  }
  // 获取 SPU 详情
  const res = (await ProductSpuApi.getSpu(row.id as number)) as ProductSpuApi.Spu
  // 只有是多规格才处理
  if (res.specType) {
    //  直接拿返回的 skus 属性逆向生成出 propertyList
    const properties = []
    res.skus?.forEach((sku) => {
      sku.properties?.forEach(({ propertyId, propertyName, valueId, valueName }) => {
        // 添加属性
        if (!properties?.some((item) => item.id === propertyId)) {
          properties.push({ id: propertyId, name: propertyName, values: [] })
        }
        // 添加属性值
        const index = properties?.findIndex((item) => item.id === propertyId)
        if (!properties[index].values?.some((value) => value.id === valueId)) {
          properties[index].values?.push({ id: valueId, name: valueName })
        }
      })
    })
    propertyList.value = properties
  }
  spuData.value = res
  isExpand.value = true
  expandRowKeys.value = [row.id!]
}

//============ 商品选择相关 ============
const selectedSpu = ref<ProductSpuApi.Spu>() // 选中的商品 spu 只能选择一个
const selectedSku = ref<ProductSpuApi.Sku[]>() // 选中的商品 sku
const selectSku = (val: ProductSpuApi.Sku[]) => {
  selectedSku.value = val
}
const selectSpu = (val: ProductSpuApi.Spu[]) => {
  // 只选择一个
  selectedSpu.value = val[0]
  // 如果大于1个
  if (val.length > 1) {
    // 清空选择
    spuListRef.value.clearSelection()
    // 变更为最后一次选择的
    spuListRef.value.toggleRowSelection(val.pop(), true)
  }
}
// 确认选择时的触发事件
const emits = defineEmits<{
  (e: 'confirm', value: ProductSpuApi.Spu, value1?: ProductSpuApi.Sku[]): void
}>()
/**
 * 确认选择返回选中的 spu 和 sku (如果需要选择sku的话)
 */
const confirm = () => {
  if (typeof selectedSpu.value === 'undefined') {
    message.warning('没有选择任何商品')
    return
  }
  if (
    (props.isSelectSku && typeof selectedSku.value === 'undefined') ||
    selectedSku.value?.length === 0
  ) {
    message.warning('没有选择任何商品属性')
    return
  }

  props.isSelectSku
    ? emits('confirm', selectedSpu.value!, selectedSku.value!)
    : emits('confirm', selectedSpu.value!)
  // 关闭弹窗
  dialogVisible.value = false
}
/** 打开弹窗 TODO 没做国际化 */
const open = (title: string) => {
  dialogTitle.value = title
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

/**
 * 校验所选是否为二级及以下节点
 */
const nodeClick = () => {
  if (!checkSelectedNode(categoryList.value, queryParams.value.categoryId)) {
    queryParams.value.categoryId = null
    message.warning('必须选择二级及以下节点！！')
  }
}
/** 初始化 **/
onMounted(async () => {
  await getList()
  // 获得分类树
  const data = await ProductCategoryApi.getCategoryList({})
  categoryList.value = handleTree(data, 'id', 'parentId')
})
</script>
