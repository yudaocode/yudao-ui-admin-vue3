<!-- WMS 库存统计 -->
<template>
  <doc-alert title="【库存】库存记录、流水、统计" url="https://doc.iocoder.cn/wms/inventory/" />

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
          <el-radio-button v-for="item in dimensionOptions" :key="item.value" :label="item.value">
            {{ item.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <WarehouseSelect v-model="queryParams.warehouseId" class="!w-240px" />
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
      <el-form-item label="商品编号" prop="itemCode">
        <el-input
          v-model="queryParams.itemCode"
          class="!w-240px"
          clearable
          placeholder="请输入商品编号"
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
      <el-form-item label="规格编号" prop="skuCode">
        <el-input
          v-model="queryParams.skuCode"
          class="!w-240px"
          clearable
          placeholder="请输入规格编号"
          @keyup.enter="handleQuery"
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

  <!-- 库存列表 -->
  <ContentWrap>
    <div class="mb-12px flex items-center justify-between">
      <span class="text-16px font-500">库存统计</span>
      <el-checkbox v-model="filterZero" @change="handleFilterZeroChange">
        过滤掉库存为0的商品
      </el-checkbox>
    </div>
    <el-table
      v-loading="loading"
      cell-class-name="!align-top"
      :data="list"
      :show-overflow-tooltip="true"
      :span-method="spanMethod"
      border
    >
      <template v-if="warehouseDimensionList.includes(queryParams.type)">
        <el-table-column label="仓库" min-width="160" prop="warehouseId">
          <template #default="scope">
            {{ scope.row.warehouseName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="240" prop="warehouseItemId">
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
      </template>
      <el-table-column align="right" label="库存" min-width="130" prop="quantity">
        <template #default="scope">
          {{ formatQuantity(scope.row.quantity) }}
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
import { InventoryApi, InventoryVO } from '@/api/wms/inventory'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import { formatQuantity } from '@/views/wms/utils/format'

/** WMS 库存统计 */
defineOptions({ name: 'WmsInventory' })

const INVENTORY_DIMENSION = {
  WAREHOUSE: 'warehouse',
  ITEM: 'item'
} as const
type InventoryDimension = (typeof INVENTORY_DIMENSION)[keyof typeof INVENTORY_DIMENSION]

const dimensionOptions = computed(() => [
  { label: '仓库', value: INVENTORY_DIMENSION.WAREHOUSE },
  { label: '商品', value: INVENTORY_DIMENSION.ITEM }
])
const warehouseDimensionList: InventoryDimension[] = [INVENTORY_DIMENSION.WAREHOUSE]

interface InventoryRow extends InventoryVO {
  warehouseItemId?: string
  skuWarehouseId?: string
}

interface SpanMethodProps {
  column: {
    property?: string
  }
  rowIndex: number
}

const loading = ref(true) // 列表的加载中
const list = ref<InventoryRow[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const filterZero = ref(false) // 是否过滤库存为 0 的商品
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  type: INVENTORY_DIMENSION.WAREHOUSE as InventoryDimension,
  itemCode: undefined as string | undefined,
  itemName: undefined as string | undefined,
  skuCode: undefined as string | undefined,
  skuName: undefined as string | undefined,
  warehouseId: undefined as number | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询库存列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await InventoryApi.getInventoryPage({
      ...queryParams,
      onlyPositiveQuantity: filterZero.value ? true : undefined
    })
    list.value = data.list.map((item: InventoryVO) => ({
      ...item,
      // 展示字段
      warehouseItemId: `${item.warehouseId || 0}-${item.itemId || 0}`,
      skuWarehouseId: `${item.skuId || 0}-${item.warehouseId || 0}`
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
  queryParams.type = INVENTORY_DIMENSION.WAREHOUSE
  filterZero.value = false
  handleQuery()
}

/** 统计维度变化 */
const handleTypeChange = () => {
  queryParams.pageNo = 1
  getList()
}

/** 是否过滤零库存变化 */
const handleFilterZeroChange = () => {
  queryParams.pageNo = 1
  getList()
}

/** 合并库存统计的维度单元格 */
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

const getRowPropertyValue = (row: InventoryRow | undefined, property: string) => {
  return row?.[property as keyof InventoryRow]
}

const getRowSpanProperties = () => {
  if (queryParams.type === INVENTORY_DIMENSION.ITEM) {
    return ['itemId', 'skuId', 'skuWarehouseId']
  }
  return ['warehouseId', 'warehouseItemId']
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
