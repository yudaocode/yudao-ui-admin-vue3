<!-- WMS 移库单 -->
<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="90px">
      <el-form-item label="移库单号" prop="no">
        <el-input v-model="queryParams.no" class="!w-240px" clearable placeholder="请输入移库单号" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-240px" clearable placeholder="请选择单据状态">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.WMS_ORDER_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="来源仓库" prop="sourceWarehouseId">
        <WarehouseSelect v-model="queryParams.sourceWarehouseId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="目标仓库" prop="targetWarehouseId">
        <WarehouseSelect v-model="queryParams.targetWarehouseId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="单据日期" prop="orderDate">
        <el-date-picker
          v-model="queryParams.orderDate"
          :shortcuts="defaultShortcuts"
          class="!w-240px"
          end-placeholder="结束时间"
          start-placeholder="开始时间"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="创建用户" prop="creator">
        <UserSelectV2 v-model="queryParams.creator" class="!w-240px" placeholder="请选择创建用户" />
      </el-form-item>
      <el-form-item label="更新用户" prop="updater">
        <UserSelectV2 v-model="queryParams.updater" class="!w-240px" placeholder="请选择更新用户" />
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
        <el-button v-hasPermi="['wms:movement-order:create']" plain type="primary" @click="openForm('create')">
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <el-button
          v-hasPermi="['wms:movement-order:export']"
          :loading="exportLoading"
          plain
          type="success"
          @click="handleExport"
        >
          <Icon class="mr-5px" icon="ep:download" />
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :show-overflow-tooltip="true"
      border
      @expand-change="handleExpandChange"
    >
      <el-table-column type="expand" width="48">
        <template #default="{ row }">
          <el-table :data="detailMap[row.id] || []" border>
            <el-table-column label="商品信息" min-width="220">
              <template #default="{ row: detail }">
                <div>{{ detail.itemName || '-' }}</div>
                <div v-if="detail.itemCode" class="text-12px text-gray-500">商品编号：{{ detail.itemCode }}</div>
              </template>
            </el-table-column>
            <el-table-column label="规格信息" min-width="220">
              <template #default="{ row: detail }">
                <div>{{ detail.skuName || '-' }}</div>
                <div v-if="detail.skuCode" class="text-12px text-gray-500">规格编号：{{ detail.skuCode }}</div>
              </template>
            </el-table-column>
            <el-table-column v-if="BATCH_ENABLE" label="批号" min-width="140" prop="batchNo" />
            <el-table-column align="right" label="移库数量" width="120">
              <template #default="{ row: detail }">{{ formatQuantity(detail.quantity) }}</template>
            </el-table-column>
            <el-table-column align="right" label="金额(元)" width="120">
              <template #default="{ row: detail }">{{ formatPrice(detail.amount) || '-' }}</template>
            </el-table-column>
            <el-table-column label="备注" min-width="160" prop="remark" />
          </el-table>
        </template>
      </el-table-column>
      <el-table-column fixed="left" label="单号" width="210">
        <template #default="{ row }">
          单号：
          <el-button link type="primary" @click="openDetail(row.id)">{{ row.no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="left" label="移库状态" width="110">
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.WMS_ORDER_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column :label="AREA_ENABLE ? '来源仓库/库区' : '来源仓库'" min-width="180">
        <template #default="{ row }">
          <template v-if="AREA_ENABLE">
            <div>仓库：{{ row.sourceWarehouseName || '-' }}</div>
            <div>库区：{{ row.sourceAreaName || '-' }}</div>
          </template>
          <template v-else>{{ row.sourceWarehouseName || '-' }}</template>
        </template>
      </el-table-column>
      <el-table-column :label="AREA_ENABLE ? '目标仓库/库区' : '目标仓库'" min-width="180">
        <template #default="{ row }">
          <template v-if="AREA_ENABLE">
            <div>仓库：{{ row.targetWarehouseName || '-' }}</div>
            <div>库区：{{ row.targetAreaName || '-' }}</div>
          </template>
          <template v-else>{{ row.targetWarehouseName || '-' }}</template>
        </template>
      </el-table-column>
      <el-table-column label="总数量/总金额(元)" min-width="180">
        <template #default="{ row }">
          <div class="flex items-center justify-between">
            <span>数量：</span>
            <span>{{ formatQuantity(row.totalQuantity) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>金额：</span>
            <span>{{ formatPrice(row.totalAmount) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作信息" min-width="280">
        <template #default="{ row }">
          <div>创建：{{ formatNullableDate(row.createTime) }} / {{ row.creatorName || row.creator || '-' }}</div>
          <div>更新：{{ formatNullableDate(row.updateTime) }} / {{ row.updaterName || row.updater || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="160" prop="remark" />
      <el-table-column align="center" fixed="right" label="操作" width="150">
        <template #default="{ row }">
          <el-tooltip :content="getUpdateTip(row.status)" :disabled="canUpdate(row.status)" placement="top">
            <span>
              <el-button
                v-hasPermi="['wms:movement-order:update']"
                :disabled="!canUpdate(row.status)"
                link
                type="primary"
                @click="openForm('update', row.id)"
              >
                修改
              </el-button>
            </span>
          </el-tooltip>
          <el-tooltip :content="getDeleteTip(row.status)" :disabled="canDelete(row.status)" placement="top">
            <span>
              <el-button
                v-hasPermi="['wms:movement-order:delete']"
                :disabled="!canDelete(row.status)"
                link
                type="danger"
                @click="handleDelete(row.id)"
              >
                删除
              </el-button>
            </span>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <Pagination v-model:limit="queryParams.pageSize" v-model:page="queryParams.pageNo" :total="total" @pagination="getList" />
  </ContentWrap>

  <MovementOrderForm ref="formRef" @success="getList" />
  <MovementOrderDetail ref="detailRef" />
</template>

<script lang="ts" setup>
import { defaultShortcuts, formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MovementOrderApi, MovementOrderVO } from '@/api/wms/order/movement'
import { MovementOrderDetailVO } from '@/api/wms/order/movement/detail'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import { AREA_ENABLE, BATCH_ENABLE } from '@/views/wms/utils/config'
import { OrderDeleteStatusList, OrderStatusEnum, OrderUpdateStatusList } from '@/views/wms/utils/constants'
import { formatPrice, formatQuantity } from '@/views/wms/utils/format'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import MovementOrderDetail from './MovementOrderDetail.vue'
import MovementOrderForm from './MovementOrderForm.vue'
import download from '@/utils/download'

/** WMS 移库单 */
defineOptions({ name: 'WmsMovementOrder' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const list = ref<MovementOrderVO[]>([])
const total = ref(0)
const getDefaultQueryParams = () => ({
  pageNo: 1,
  pageSize: 10,
  no: undefined as string | undefined,
  status: undefined as number | undefined,
  sourceWarehouseId: undefined as number | undefined,
  targetWarehouseId: undefined as number | undefined,
  orderDate: undefined as string[] | undefined,
  creator: undefined as number | undefined,
  updater: undefined as number | undefined
})
const queryParams = reactive(getDefaultQueryParams())
const queryFormRef = ref()
const exportLoading = ref(false)
const detailMap = reactive<Record<number, MovementOrderDetailVO[]>>({})

const canUpdate = (status?: number) => status !== undefined && OrderUpdateStatusList.includes(status)
const canDelete = (status?: number) => status !== undefined && OrderDeleteStatusList.includes(status)
const getUpdateTip = (status?: number) => {
  if (status === OrderStatusEnum.FINISHED) return '已移库，无法修改'
  if (status === OrderStatusEnum.CANCELED) return '已作废，无法修改'
  return '当前状态无法修改'
}
const getDeleteTip = (status?: number) => {
  if (status === OrderStatusEnum.FINISHED) return '已移库，无法删除'
  return '当前状态无法删除'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await MovementOrderApi.getMovementOrderPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}
const resetQuery = () => {
  Object.assign(queryParams, getDefaultQueryParams())
  handleQuery()
}
const handleExpandChange = async (row: MovementOrderVO) => {
  if (!row.id || detailMap[row.id]) return
  detailMap[row.id] = await MovementOrderApi.getMovementOrderDetailListByOrderId(row.id)
}

const formRef = ref()
const openForm = (type: string, id?: number) => formRef.value.open(type, id)
const detailRef = ref()
const openDetail = (id: number) => detailRef.value.open(id)

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await MovementOrderApi.deleteMovementOrder(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await MovementOrderApi.exportMovementOrder(queryParams)
    download.excel(data, '移库单.xls')
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => getList())
</script>
