<!-- WMS 库存流水 -->
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
      <el-form-item label="单据类型" prop="orderType">
        <el-select
          v-model="queryParams.orderType"
          class="!w-240px"
          clearable
          placeholder="请选择单据类型"
          @change="handleQuery"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.WMS_ORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="单据号" prop="orderNo">
        <el-input
          v-model="queryParams.orderNo"
          class="!w-240px"
          clearable
          placeholder="请输入单据号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <WarehouseSelect v-model="queryParams.warehouseId" class="!w-240px" />
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
      <el-form-item label="操作时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :shortcuts="defaultShortcuts"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="datetimerange"
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

  <!-- 库存流水列表 -->
  <ContentWrap>
    <div class="mb-12px text-16px font-500">库存流水</div>
    <el-table
      v-loading="loading"
      cell-class-name="!align-top"
      :data="list"
      :show-overflow-tooltip="true"
      border
    >
      <el-table-column fixed="left" label="单据号" prop="orderNo" width="180" />
      <el-table-column align="center" fixed="left" label="单据类型" width="110">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.WMS_ORDER_TYPE" :value="scope.row.orderType" />
        </template>
      </el-table-column>
      <el-table-column label="商品信息" min-width="220">
        <template #default="scope">
          <div class="text-14px">{{ scope.row.itemName || '-' }}</div>
          <div v-if="scope.row.itemCode" class="text-12px text-gray-500">
            商品编号：{{ scope.row.itemCode }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="规格信息" min-width="180">
        <template #default="scope">
          <div class="text-14px">{{ scope.row.skuName || '-' }}</div>
          <div v-if="scope.row.skuCode" class="text-12px text-gray-500">
            规格编号：{{ scope.row.skuCode }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="仓库" min-width="160">
        <template #default="scope">
          {{ scope.row.warehouseName || '-' }}
        </template>
      </el-table-column>
      <el-table-column align="right" label="操作前" min-width="110">
        <template #default="scope">
          {{ formatQuantity(scope.row.beforeQuantity) || '-' }}
        </template>
      </el-table-column>
      <el-table-column align="right" label="操作后" min-width="110">
        <template #default="scope">
          {{ formatQuantity(scope.row.afterQuantity) || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="数量/金额(元)" min-width="150">
        <template #default="scope">
          <div class="flex justify-between">
            <span>数量：</span>
            <span>{{ formatQuantity(scope.row.quantity) }}</span>
          </div>
          <div v-if="scope.row.price || scope.row.price === 0" class="flex justify-between">
            <span>单价：</span>
            <span>{{ formatPrice(scope.row.price) }}</span>
          </div>
          <div
            v-if="scope.row.totalPrice || scope.row.totalPrice === 0"
            class="flex justify-between"
          >
            <span>金额：</span>
            <span>{{ formatPrice(scope.row.totalPrice) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        :formatter="dateFormatter"
        align="center"
        fixed="right"
        label="操作时间"
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
</template>

<script lang="ts" setup>
import { dateFormatter, defaultShortcuts } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { InventoryHistoryApi, InventoryHistoryVO } from '@/api/wms/inventory/history'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import { formatPrice, formatQuantity } from '@/views/wms/utils/format'

/** WMS 库存流水 */
defineOptions({ name: 'WmsInventoryHistory' })

const loading = ref(true) // 列表的加载中
const list = ref<InventoryHistoryVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  orderType: undefined as number | undefined,
  orderNo: undefined as string | undefined,
  itemCode: undefined as string | undefined,
  itemName: undefined as string | undefined,
  skuCode: undefined as string | undefined,
  skuName: undefined as string | undefined,
  warehouseId: undefined as number | undefined,
  createTime: undefined as string[] | undefined
})
const queryFormRef = ref() // 搜索的表单

/** 查询库存流水列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await InventoryHistoryApi.getInventoryHistoryPage(queryParams)
    list.value = data.list
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
  handleQuery()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
