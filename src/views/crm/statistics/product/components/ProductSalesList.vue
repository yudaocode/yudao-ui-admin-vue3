<!-- 产品销售情况统计 -->
<template>
  <!-- 统计列表 -->
  <el-card shadow="never">
    <el-table
      v-loading="loading"
      :cell-class-name="getCellClassName"
      :data="list"
      :row-class-name="getRowClassName"
      :show-overflow-tooltip="true"
      :span-method="spanMethod"
    >
      <el-table-column label="序号" align="center" width="80">
        <template #default="{ row }">
          <span v-if="row.rowType === ProductSalesRowTypeEnum.DETAIL">{{ row.index }}</span>
          <span v-else>{{ row.summaryLabel }}</span>
        </template>
      </el-table-column>
      <el-table-column label="产品分类" align="center" prop="categoryName" min-width="140" />
      <el-table-column label="产品名称" align="center" prop="productName" min-width="180">
        <template #default="{ row }">
          <el-link
            v-if="row.rowType === ProductSalesRowTypeEnum.DETAIL"
            :underline="false"
            type="primary"
            @click="openProduct(row.productId)"
          >
            {{ row.productName }}
          </el-link>
          <span v-else>{{ row.summaryLabel }}</span>
        </template>
      </el-table-column>
      <el-table-column label="合同编号" align="center" prop="contractNo" min-width="160">
        <template #default="{ row }">
          <el-link
            v-if="row.rowType === ProductSalesRowTypeEnum.DETAIL"
            :underline="false"
            type="primary"
            @click="openContract(row.contractId)"
          >
            {{ row.contractNo }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="合同名称" align="center" prop="contractName" min-width="180" />
      <el-table-column label="负责人" align="center" prop="ownerUserName" min-width="120" />
      <el-table-column label="客户名称" align="center" prop="customerName" min-width="180">
        <template #default="{ row }">
          <el-link
            v-if="row.rowType === ProductSalesRowTypeEnum.DETAIL && row.customerId"
            :underline="false"
            type="primary"
            @click="openCustomer(row.customerId)"
          >
            {{ row.customerName }}
          </el-link>
          <span v-else-if="row.rowType === ProductSalesRowTypeEnum.DETAIL">{{
            row.customerName
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="销售单价（元）" align="right" prop="productPrice" min-width="140">
        <template #default="{ row }">
          <span v-if="row.rowType === ProductSalesRowTypeEnum.DETAIL">
            {{ erpPriceInputFormatter(row.productPrice) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="right" prop="productCount" min-width="120" />
      <el-table-column
        label="订单产品小计（元）"
        align="right"
        prop="productTotalPrice"
        min-width="160"
      >
        <template #default="{ row }">
          {{ erpPriceInputFormatter(row.productTotalPrice) }}
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { CrmStatisticsProductSalesRespVO, StatisticsProductApi } from '@/api/crm/statistics/product'
import { erpPriceInputFormatter } from '@/utils'

defineOptions({ name: 'CrmStatisticsProductSalesList' })

const props = defineProps<{ queryParams: any }>() // 搜索参数

enum ProductSalesRowTypeEnum {
  DETAIL = 'detail',
  PRODUCT_SUMMARY = 'productSummary',
  CATEGORY_SUMMARY = 'categorySummary'
}

type ProductSalesRow = Partial<CrmStatisticsProductSalesRespVO> & {
  rowType: ProductSalesRowTypeEnum
  index?: number
  categoryRowspan?: number
  productRowspan?: number
  summaryLabel?: string
}

const { push } = useRouter()
const loading = ref(false) // 加载中
const list = ref<ProductSalesRow[]>([]) // 列表的数据
// 列顺序变更时，需要同步调整合并列和可点击列
const SUMMARY_LABEL_COLUMN_INDEX = 0
const CATEGORY_COLUMN_INDEX = 1
const PRODUCT_COLUMN_INDEX = 2
const CONTRACT_NO_COLUMN_INDEX = 3
const CUSTOMER_COLUMN_INDEX = 6
const SUMMARY_VALUE_COLUMN_INDEX = 8
const LINK_COLUMN_INDEXES = [PRODUCT_COLUMN_INDEX, CONTRACT_NO_COLUMN_INDEX, CUSTOMER_COLUMN_INDEX]

/** 转换为数值 */
const getNumber = (value?: number) => Number(value || 0)

/** 获得分类分组 Key */
const getCategoryKey = (item: CrmStatisticsProductSalesRespVO) =>
  item.categoryId || `category-${item.categoryName}`

/** 获得产品分组 Key */
const getProductKey = (item: CrmStatisticsProductSalesRespVO) => item.productId

/** 构建产品小计行 */
const buildProductSummaryRow = (rows: CrmStatisticsProductSalesRespVO[]): ProductSalesRow => ({
  rowType: ProductSalesRowTypeEnum.PRODUCT_SUMMARY,
  summaryLabel: `${rows[0]?.productName || '产品'} 小计`,
  productCount: rows.reduce((sum, item) => sum + getNumber(item.productCount), 0),
  productTotalPrice: rows.reduce((sum, item) => sum + getNumber(item.productTotalPrice), 0)
})

/** 构建分类小计行 */
const buildCategorySummaryRow = (rows: CrmStatisticsProductSalesRespVO[]): ProductSalesRow => ({
  rowType: ProductSalesRowTypeEnum.CATEGORY_SUMMARY,
  summaryLabel: `${rows[0]?.categoryName || '未分类'} 小计`,
  productCount: rows.reduce((sum, item) => sum + getNumber(item.productCount), 0),
  productTotalPrice: rows.reduce((sum, item) => sum + getNumber(item.productTotalPrice), 0)
})

/** 按产品分组 */
const buildProductGroups = (rows: CrmStatisticsProductSalesRespVO[]) => {
  const result: CrmStatisticsProductSalesRespVO[][] = []
  let index = 0
  while (index < rows.length) {
    const productKey = getProductKey(rows[index])
    const productRows: CrmStatisticsProductSalesRespVO[] = []
    while (index < rows.length && getProductKey(rows[index]) === productKey) {
      productRows.push(rows[index])
      index++
    }
    result.push(productRows)
  }
  return result
}

/** 构建列表展示数据 */
const buildList = (data: CrmStatisticsProductSalesRespVO[]): ProductSalesRow[] => {
  const result: ProductSalesRow[] = []
  let index = 0
  let rowIndex = 1
  while (index < data.length) {
    const categoryStartIndex = result.length
    const categoryKey = getCategoryKey(data[index])
    const categoryRows: CrmStatisticsProductSalesRespVO[] = []

    while (index < data.length && getCategoryKey(data[index]) === categoryKey) {
      categoryRows.push(data[index])
      index++
    }

    const productGroups = buildProductGroups(categoryRows)
    const productSummaryRows: ProductSalesRow[] = []
    productGroups.forEach((productRows) => {
      const productStartIndex = result.length
      productRows.forEach((row) => {
        result.push({
          ...row,
          rowType: ProductSalesRowTypeEnum.DETAIL,
          index: rowIndex++
        })
      })
      result[productStartIndex].productRowspan = productRows.length
      if (productGroups.length > 1 && productRows.length > 1) {
        productSummaryRows.push(buildProductSummaryRow(productRows))
      }
    })

    if (result.length > categoryStartIndex) {
      result[categoryStartIndex].categoryRowspan = categoryRows.length
    }
    result.push(...productSummaryRows)
    result.push(buildCategorySummaryRow(categoryRows))
  }
  return result
}

/** 获取产品销售情况统计 */
const loadData = async () => {
  loading.value = true
  try {
    list.value = buildList(await StatisticsProductApi.getProductSalesList(props.queryParams))
  } finally {
    loading.value = false
  }
}

/** 打开合同详情 */
const openContract = (id?: number) => {
  if (!id) {
    return
  }
  push({ name: 'CrmContractDetail', params: { id } })
}

/** 打开客户详情 */
const openCustomer = (id?: number) => {
  if (!id) {
    return
  }
  push({ name: 'CrmCustomerDetail', params: { id } })
}

/** 打开产品详情 */
const openProduct = (id?: number) => {
  if (!id) {
    return
  }
  push({ name: 'CrmProductDetail', params: { id } })
}

/** 合并产品分类、产品名称单元格 */
const spanMethod = ({ row, columnIndex }: { row: ProductSalesRow; columnIndex: number }) => {
  if (
    row.rowType === ProductSalesRowTypeEnum.PRODUCT_SUMMARY ||
    row.rowType === ProductSalesRowTypeEnum.CATEGORY_SUMMARY
  ) {
    if (columnIndex === SUMMARY_LABEL_COLUMN_INDEX) {
      return { rowspan: 1, colspan: SUMMARY_VALUE_COLUMN_INDEX }
    }
    if (columnIndex > SUMMARY_LABEL_COLUMN_INDEX && columnIndex < SUMMARY_VALUE_COLUMN_INDEX) {
      return { rowspan: 0, colspan: 0 }
    }
  }
  if (columnIndex === CATEGORY_COLUMN_INDEX) {
    if (row.rowType !== ProductSalesRowTypeEnum.DETAIL) {
      return { rowspan: 0, colspan: 0 }
    }
    return row.categoryRowspan
      ? { rowspan: row.categoryRowspan, colspan: 1 }
      : { rowspan: 0, colspan: 0 }
  }
  if (columnIndex === PRODUCT_COLUMN_INDEX) {
    if (row.rowType !== ProductSalesRowTypeEnum.DETAIL) {
      return
    }
    return row.productRowspan
      ? { rowspan: row.productRowspan, colspan: 1 }
      : { rowspan: 0, colspan: 0 }
  }
}

/** 设置小计行样式 */
const getRowClassName = ({ row }: { row: ProductSalesRow }) => {
  if (row.rowType === ProductSalesRowTypeEnum.PRODUCT_SUMMARY) {
    return 'product-summary-row'
  }
  if (row.rowType === ProductSalesRowTypeEnum.CATEGORY_SUMMARY) {
    return 'category-summary-row'
  }
  return ''
}

/** 设置可点击单元格样式 */
const getCellClassName = ({ row, columnIndex }: { row: ProductSalesRow; columnIndex: number }) => {
  return row.rowType === ProductSalesRowTypeEnum.DETAIL && LINK_COLUMN_INDEXES.includes(columnIndex)
    ? 'is-link-cell'
    : ''
}

defineExpose({ loadData })

/** 初始化 */
onMounted(() => {
  loadData()
})
</script>

<style scoped>
:deep(.product-summary-row > td) {
  font-weight: 600;
  background-color: #fff9f2 !important;
}

:deep(.category-summary-row > td) {
  font-weight: 600;
  background-color: #fff3e8 !important;
}

:deep(.is-link-cell) {
  color: var(--el-color-primary);
  cursor: pointer;
}
</style>
