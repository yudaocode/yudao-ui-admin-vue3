<!-- WMS 库存明细 -->
<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="统计维度" prop="type">
        <el-radio-group v-model="queryParams.type" class="!w-240px" @change="handleTypeChange">
          <el-radio-button
            v-for="item in detailDimensionOptions"
            :key="item.value"
            :label="item.value"
          >
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="商品编号" prop="itemCode">
        <el-input
          v-model="queryParams.itemCode"
          class="!w-240px"
          clearable
          placeholder="请输入商品编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="商品名称" prop="itemName">
        <el-input
          v-model="queryParams.itemName"
          class="!w-240px"
          clearable
          placeholder="请输入商品名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <WarehouseSelect
          v-model="queryParams.warehouseId"
          class="!w-240px"
          @change="handleWarehouseChange"
        />
      </el-form-item>
      <el-form-item v-if="AREA_ENABLE" label="库区" prop="areaId">
        <WarehouseAreaSelect
          v-model="queryParams.areaId"
          :warehouse-id="queryParams.warehouseId"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="规格编号" prop="skuCode">
        <el-input
          v-model="queryParams.skuCode"
          class="!w-240px"
          clearable
          placeholder="请输入规格编号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="规格名称" prop="skuName">
        <el-input
          v-model="queryParams.skuName"
          class="!w-240px"
          clearable
          placeholder="请输入规格名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item v-if="BATCH_ENABLE" label="批号" prop="batchNo">
        <el-input
          v-model="queryParams.batchNo"
          class="!w-240px"
          clearable
          placeholder="请输入批号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item v-if="BATCH_ENABLE" label="过期日期" prop="expirationDate">
        <el-date-picker
          v-model="queryParams.expirationDate"
          :shortcuts="defaultShortcuts"
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
  </ContentWrap>

  <!-- 库存明细列表 -->
  <ContentWrap>
    <div class="mb-12px text-16px font-500">库存明细</div>
    <el-table
      v-loading="loading"
      :cell-class-name="'wms-inventory-detail-cell'"
      :data="list"
      :show-overflow-tooltip="true"
      :span-method="spanMethod"
      border
    >
      <template v-if="queryParams.type === INVENTORY_DETAIL_DIMENSION.WAREHOUSE">
        <el-table-column label="仓库" min-width="160" prop="warehouseId">
          <template #default="scope">
            {{ scope.row.warehouseName || '-' }}
          </template>
        </el-table-column>
        <el-table-column v-if="AREA_ENABLE" label="库区" min-width="160" prop="areaId">
          <template #default="scope">
            {{ scope.row.areaName || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          label="商品信息"
          min-width="240"
          :prop="AREA_ENABLE ? 'areaItemId' : 'warehouseItemId'"
        >
          <template #default="scope">
            <div>{{ scope.row.itemName || '-' }}</div>
            <div v-if="scope.row.itemCode" class="text-12px text-gray-500">
              商品编号：{{ scope.row.itemCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="规格信息"
          min-width="220"
          :prop="AREA_ENABLE ? 'areaSkuId' : 'warehouseSkuId'"
        >
          <template #default="scope">
            <div>{{ scope.row.skuName || '-' }}</div>
            <div v-if="scope.row.skuCode" class="text-12px text-gray-500">
              规格编号：{{ scope.row.skuCode }}
            </div>
          </template>
        </el-table-column>
      </template>
      <template v-else>
        <el-table-column label="商品信息" min-width="240" prop="itemId">
          <template #default="scope">
            <div>{{ scope.row.itemName || '-' }}</div>
            <div v-if="scope.row.itemCode" class="text-12px text-gray-500">
              商品编号：{{ scope.row.itemCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格信息" min-width="220" prop="skuId">
          <template #default="scope">
            <div>{{ scope.row.skuName || '-' }}</div>
            <div v-if="scope.row.skuCode" class="text-12px text-gray-500">
              规格编号：{{ scope.row.skuCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="仓库" min-width="160" prop="skuWarehouseId">
          <template #default="scope">
            {{ scope.row.warehouseName || '-' }}
          </template>
        </el-table-column>
        <el-table-column v-if="AREA_ENABLE" label="所属库区" min-width="160" prop="skuAreaId">
          <template #default="scope">
            {{ scope.row.areaName || '-' }}
          </template>
        </el-table-column>
      </template>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        label="入库日期"
        prop="createTime"
        width="180"
      />
      <el-table-column align="right" label="库存" min-width="120">
        <template #default="scope">
          {{ formatNumber(scope.row.remainQuantity, 2) }}
        </template>
      </el-table-column>
      <el-table-column
        v-if="BATCH_ENABLE"
        align="center"
        label="批号"
        min-width="140"
        prop="batchNo"
      />
      <el-table-column
        v-if="BATCH_ENABLE"
        align="left"
        label="生产日期/过期日期"
        min-width="180"
      >
        <template #default="scope">
          <div v-if="scope.row.productionDate">
            生产日期：{{ formatDate(scope.row.productionDate, 'YYYY-MM-DD') }}
          </div>
          <div v-if="scope.row.expirationDate">
            过期日期：{{ formatDate(scope.row.expirationDate, 'YYYY-MM-DD') }}
          </div>
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
</template>

<script lang="ts" setup>
import { dateFormatter, defaultShortcuts, formatDate } from '@/utils/formatTime'
import { InventoryDetailApi, InventoryDetailVO } from '@/api/wms/inventory/detail'
import WarehouseAreaSelect from '@/views/wms/md/warehouse/components/WarehouseAreaSelect.vue'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import { AREA_ENABLE, BATCH_ENABLE } from '@/views/wms/utils/config'
import { formatNumber } from '@/views/wms/utils/format'

/** WMS 库存明细 */
defineOptions({ name: 'WmsInventoryDetail' })

const INVENTORY_DETAIL_DIMENSION = {
  WAREHOUSE: 'warehouse',
  ITEM: 'item'
} as const
type InventoryDetailDimension =
  (typeof INVENTORY_DETAIL_DIMENSION)[keyof typeof INVENTORY_DETAIL_DIMENSION]

const detailDimensionOptions = [
  { label: '仓库库区', value: INVENTORY_DETAIL_DIMENSION.WAREHOUSE },
  { label: '商品', value: INVENTORY_DETAIL_DIMENSION.ITEM }
]

interface InventoryDetailRow extends InventoryDetailVO {
  warehouseItemId?: string
  warehouseSkuId?: string
  areaItemId?: string
  areaSkuId?: string
  skuWarehouseId?: string
  skuAreaId?: string
}

interface SpanMethodProps {
  column: {
    property?: string
  }
  rowIndex: number
}

const loading = ref(true) // 列表的加载中
const list = ref<InventoryDetailRow[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: INVENTORY_DETAIL_DIMENSION.WAREHOUSE as InventoryDetailDimension,
  itemCode: undefined as string | undefined,
  itemName: undefined as string | undefined,
  skuCode: undefined as string | undefined,
  skuName: undefined as string | undefined,
  warehouseId: undefined as number | undefined,
  areaId: undefined as number | undefined,
  batchNo: undefined as string | undefined,
  expirationDate: undefined as string[] | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询库存明细列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await InventoryDetailApi.getInventoryDetailPage(queryParams)
    list.value = data.list.map((item: InventoryDetailVO) => ({
      ...item,
      // 展示字段
      warehouseItemId: `${item.warehouseId || 0}-${item.itemId || 0}`,
      warehouseSkuId: `${item.warehouseId || 0}-${item.skuId || 0}`,
      areaItemId: `${item.warehouseId || 0}-${item.areaId || 0}-${item.itemId || 0}`,
      areaSkuId: `${item.warehouseId || 0}-${item.areaId || 0}-${item.skuId || 0}`,
      skuWarehouseId: `${item.skuId || 0}-${item.warehouseId || 0}`,
      skuAreaId: `${item.skuId || 0}-${item.warehouseId || 0}-${item.areaId || 0}`
    }))
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  queryParams.type = INVENTORY_DETAIL_DIMENSION.WAREHOUSE
  handleQuery()
}

/** 统计维度变化 */
const handleTypeChange = () => {
  queryParams.pageNo = 1
  getList()
}

/** 仓库变化 */
const handleWarehouseChange = () => {
  queryParams.areaId = undefined
}

/** 合并库存明细的维度单元格 */
const spanMethod = ({ column, rowIndex }: SpanMethodProps) => {
  const property = column.property
  if (!property || !getRowSpanProperties().includes(property)) {
    return { rowspan: 1, colspan: 1 }
  }
  const row = list.value[rowIndex]
  if (
    rowIndex > 0 &&
    getRowPropertyValue(list.value[rowIndex - 1], property) === getRowPropertyValue(row, property)
  ) {
    return { rowspan: 0, colspan: 0 }
  }
  let rowspan = 1
  for (let index = rowIndex + 1; index < list.value.length; index++) {
    if (getRowPropertyValue(list.value[index], property) !== getRowPropertyValue(row, property)) {
      break
    }
    rowspan++
  }
  return { rowspan, colspan: 1 }
}

const getRowPropertyValue = (row: InventoryDetailRow | undefined, property: string) => {
  return row?.[property as keyof InventoryDetailRow]
}

const getRowSpanProperties = () => {
  if (queryParams.type === INVENTORY_DETAIL_DIMENSION.ITEM) {
    return ['itemId', 'skuId', 'skuWarehouseId', 'skuAreaId']
  }
  return AREA_ENABLE
    ? ['warehouseId', 'areaId', 'areaItemId', 'areaSkuId']
    : ['warehouseId', 'warehouseItemId', 'warehouseSkuId']
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>

<style scoped>
:deep(.wms-inventory-detail-cell) {
  vertical-align: top;
}
</style>
