<!-- WMS 盘库单 -->
<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="90px">
      <el-form-item label="盘库单号" prop="no">
        <el-input v-model="queryParams.no" class="!w-240px" clearable placeholder="请输入盘库单号" @keyup.enter="handleQuery" />
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
      <el-form-item label="仓库" prop="warehouseId">
        <WarehouseSelect v-model="queryParams.warehouseId" class="!w-240px" />
      </el-form-item>
      <el-form-item label="单据日期" prop="orderTime">
        <el-date-picker
          v-model="queryParams.orderTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="盈亏数量" prop="totalQuantityMin">
        <div class="flex w-240px items-center gap-8px">
          <el-input-number
            v-model="queryParams.totalQuantityMin"
            :controls="false"
            :precision="QUANTITY_PRECISION"
            class="!w-105px"
            placeholder="最小值"
          />
          <span>至</span>
          <el-input-number
            v-model="queryParams.totalQuantityMax"
            :controls="false"
            :precision="QUANTITY_PRECISION"
            class="!w-105px"
            placeholder="最大值"
          />
        </div>
      </el-form-item>
      <el-form-item label="总金额" prop="totalAmountMin">
        <div class="flex w-240px items-center gap-8px">
          <el-input-number
            v-model="queryParams.totalAmountMin"
            :controls="false"
            :min="0"
            :precision="PRICE_PRECISION"
            class="!w-105px"
            placeholder="最小值"
          />
          <span>至</span>
          <el-input-number
            v-model="queryParams.totalAmountMax"
            :controls="false"
            :min="0"
            :precision="PRICE_PRECISION"
            class="!w-105px"
            placeholder="最大值"
          />
        </div>
      </el-form-item>
      <el-form-item label="创建用户" prop="creator">
        <UserSelectV2 v-model="queryParams.creator" class="!w-240px" placeholder="请选择创建用户" />
      </el-form-item>
      <el-form-item label="更新用户" prop="updater">
        <UserSelectV2 v-model="queryParams.updater" class="!w-240px" placeholder="请选择更新用户" />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :shortcuts="defaultShortcuts"
          class="!w-240px"
          end-placeholder="结束时间"
          start-placeholder="开始时间"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="更新时间" prop="updateTime">
        <el-date-picker
          v-model="queryParams.updateTime"
          :shortcuts="defaultShortcuts"
          class="!w-240px"
          end-placeholder="结束时间"
          start-placeholder="开始时间"
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
        <el-popover popper-class="wms-check-order-table-setting-popover" trigger="click" width="520">
          <template #reference>
            <el-button>
              <Icon class="mr-5px" icon="ep:setting" />
              表格设置
            </el-button>
          </template>
          <el-checkbox-group
            v-model="checkedTableColumns"
            class="wms-check-order-table-setting grid grid-cols-3 gap-y-14px rounded p-16px"
          >
            <el-checkbox v-for="column in tableColumnOptions" :key="column.value" :label="column.value">
              {{ column.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-popover>
        <el-button v-hasPermi="['wms:check-order:create']" plain type="primary" @click="openForm('create')">
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <el-button
          v-hasPermi="['wms:check-order:export']"
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
      :cell-class-name="'wms-check-order-cell'"
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
            <el-table-column align="right" label="账面数量" width="120">
              <template #default="{ row: detail }">{{ formatQuantity(detail.quantity) }}</template>
            </el-table-column>
            <el-table-column align="right" label="实盘数量" width="120">
              <template #default="{ row: detail }">{{ formatQuantity(detail.checkQuantity) }}</template>
            </el-table-column>
            <el-table-column align="right" label="盈亏数量" width="120">
              <template #default="{ row: detail }">{{ formatQuantity(detail.differenceQuantity) }}</template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column v-if="isTableColumnVisible('no')" fixed="left" label="单号" width="210">
        <template #default="{ row }">
          单号：
          <el-button link type="primary" @click="openDetail(row.id)">{{ row.no }}</el-button>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('status')"
        align="center"
        fixed="left"
        label="盘库状态"
        width="110"
      >
        <template #default="{ row }">
          <dict-tag :type="DICT_TYPE.WMS_ORDER_STATUS" :value="row.status" />
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('warehouse')"
        label="仓库"
        min-width="180"
      >
        <template #default="{ row }">
          {{ row.warehouseName || '-' }}
        </template>
      </el-table-column>
      <el-table-column v-if="isTableColumnVisible('quantityAmount')" label="盈亏数量/总金额(元)" min-width="180">
        <template #default="{ row }">
          <div class="flex items-center justify-between">
            <span>盈亏：</span>
            <span>{{ formatQuantity(row.totalQuantity) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>金额：</span>
            <span>{{ formatPrice(row.totalAmount) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-if="isTableColumnVisible('operateInfo')" label="操作信息" min-width="280">
        <template #default="{ row }">
          <div>创建：{{ formatNullableDate(row.createTime) }} / {{ row.creatorName || row.creator || '-' }}</div>
          <div>更新：{{ formatNullableDate(row.updateTime) }} / {{ row.updaterName || row.updater || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column v-if="isTableColumnVisible('remark')" label="备注" min-width="160" prop="remark" />
      <el-table-column align="center" fixed="right" label="操作" width="150">
        <template #default="{ row }">
          <el-tooltip :content="getUpdateTip(row.status)" :disabled="canUpdate(row.status)" placement="top">
            <span>
              <el-button
                v-hasPermi="['wms:check-order:update']"
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
                v-hasPermi="['wms:check-order:delete']"
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

  <CheckOrderForm ref="formRef" @success="getList" />
  <CheckOrderDetail ref="detailRef" />
</template>

<script lang="ts" setup>
import { defaultShortcuts, formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CheckOrderApi, CheckOrderVO } from '@/api/wms/order/check'
import { CheckOrderDetailVO } from '@/api/wms/order/check/detail'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import { OrderDeleteStatusList, OrderStatusEnum, OrderUpdateStatusList } from '@/views/wms/utils/constants'
import { formatPrice, formatQuantity, PRICE_PRECISION, QUANTITY_PRECISION } from '@/views/wms/utils/format'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import CheckOrderDetail from './CheckOrderDetail.vue'
import CheckOrderForm from './CheckOrderForm.vue'
import download from '@/utils/download'

/** WMS 盘库单 */
defineOptions({ name: 'WmsCheckOrder' })

const message = useMessage()
const { t } = useI18n()

type TableColumnKey = 'no' | 'status' | 'warehouse' | 'quantityAmount' | 'operateInfo' | 'remark'

const tableColumnOptions: Array<{ label: string; value: TableColumnKey }> = [
  { label: '单号', value: 'no' },
  { label: '盘库状态', value: 'status' },
  { label: '仓库', value: 'warehouse' },
  { label: '盈亏/金额(元)', value: 'quantityAmount' },
  { label: '操作信息', value: 'operateInfo' },
  { label: '备注', value: 'remark' }
]
const checkedTableColumns = ref<TableColumnKey[]>([
  'no',
  'status',
  'warehouse',
  'quantityAmount',
  'operateInfo',
  'remark'
])
const isTableColumnVisible = (column: TableColumnKey) => checkedTableColumns.value.includes(column)

const loading = ref(true)
const list = ref<CheckOrderVO[]>([])
const total = ref(0)
const getDefaultQueryParams = () => ({
  pageNo: 1,
  pageSize: 10,
  no: undefined as string | undefined,
  status: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  orderTime: undefined as string[] | undefined,
  totalQuantityMin: undefined as number | undefined,
  totalQuantityMax: undefined as number | undefined,
  totalAmountMin: undefined as number | undefined,
  totalAmountMax: undefined as number | undefined,
  creator: undefined as number | undefined,
  updater: undefined as number | undefined,
  createTime: undefined as string[] | undefined,
  updateTime: undefined as string[] | undefined
})
const queryParams = reactive(getDefaultQueryParams())
const queryFormRef = ref()
const exportLoading = ref(false)
const detailMap = reactive<Record<number, CheckOrderDetailVO[]>>({})

const canUpdate = (status?: number) => status !== undefined && OrderUpdateStatusList.includes(status)
const canDelete = (status?: number) => status !== undefined && OrderDeleteStatusList.includes(status)
const getUpdateTip = (status?: number) => {
  if (status === OrderStatusEnum.FINISHED) return '已盘库，无法修改'
  if (status === OrderStatusEnum.CANCELED) return '已作废，无法修改'
  return '当前状态无法修改'
}
const getDeleteTip = (status?: number) => {
  if (status === OrderStatusEnum.FINISHED) return '已盘库，无法删除'
  return '当前状态无法删除'
}

const getList = async () => {
  loading.value = true
  try {
    const data = await CheckOrderApi.getCheckOrderPage(queryParams)
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
const handleExpandChange = async (row: CheckOrderVO) => {
  if (!row.id || detailMap[row.id]) return
  detailMap[row.id] = await CheckOrderApi.getCheckOrderDetailListByOrderId(row.id)
}

const formRef = ref()
const openForm = (type: string, id?: number) => formRef.value.open(type, id)
const detailRef = ref()
const openDetail = (id: number) => detailRef.value.open(id)

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CheckOrderApi.deleteCheckOrder(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await CheckOrderApi.exportCheckOrder(queryParams)
    download.excel(data, '盘库单.xls')
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => getList())
</script>

<style scoped>
:deep(.wms-check-order-cell) {
  vertical-align: top;
}

:global(.wms-check-order-table-setting-popover) {
  padding: 12px;
}

:global(.wms-check-order-table-setting) {
  background-color: var(--el-fill-color-light);
}

:global(.wms-check-order-table-setting .el-checkbox) {
  height: 28px;
  margin-right: 0;
}

:global(.wms-check-order-table-setting .el-checkbox__label) {
  font-size: 16px;
  font-weight: 600;
}
</style>
