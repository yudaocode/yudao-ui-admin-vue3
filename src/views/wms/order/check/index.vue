<!-- WMS 盘库单 -->
<template>
  <doc-alert title="【单据】盘库" url="https://doc.iocoder.cn/wms/order/check/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="80px"
    >
      <el-form-item label="盘库单号" prop="no">
        <el-input
          v-model="queryParams.no"
          class="!w-240px"
          clearable
          placeholder="请输入盘库单号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="单据状态" prop="status">
        <el-select
          v-model="queryParams.status"
          class="!w-240px"
          clearable
          placeholder="请选择单据状态"
        >
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
      <el-form-item label="总金额" prop="totalPriceMin">
        <div class="flex w-240px items-center gap-8px">
          <el-input-number
            v-model="queryParams.totalPriceMin"
            :controls="false"
            :min="0"
            :precision="PRICE_PRECISION"
            class="!w-105px"
            placeholder="最小值"
          />
          <span>至</span>
          <el-input-number
            v-model="queryParams.totalPriceMax"
            :controls="false"
            :min="0"
            :precision="PRICE_PRECISION"
            class="!w-105px"
            placeholder="最大值"
          />
        </div>
      </el-form-item>
      <el-form-item label="实际金额" prop="actualPriceMin">
        <div class="flex w-240px items-center gap-8px">
          <el-input-number
            v-model="queryParams.actualPriceMin"
            :controls="false"
            :min="0"
            :precision="PRICE_PRECISION"
            class="!w-105px"
            placeholder="最小值"
          />
          <span>至</span>
          <el-input-number
            v-model="queryParams.actualPriceMax"
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
        <el-popover popper-class="!p-12px" trigger="click" width="520">
          <template #reference>
            <el-button>
              <Icon class="mr-5px" icon="ep:setting" />
              表格设置
            </el-button>
          </template>
          <el-checkbox-group
            v-model="checkedTableColumns"
            class="grid grid-cols-3 gap-y-14px rounded bg-[var(--el-fill-color-light)] p-16px"
          >
            <el-checkbox
              v-for="column in tableColumnOptions"
              :key="column.value"
              class="!h-28px !mr-0 [&_.el-checkbox__label]:font-600 [&_.el-checkbox__label]:text-16px"
              :label="column.value"
            >
              {{ column.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-popover>
        <el-button
          v-hasPermi="['wms:check-order:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
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

  <!-- 盘库单列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      cell-class-name="!align-top"
      :data="list"
      :show-overflow-tooltip="true"
      border
      @expand-change="handleExpandChange"
    >
      <el-table-column type="expand" width="48">
        <template #default="scope">
          <el-table :data="detailMap[scope.row.id] || []" border>
            <el-table-column label="商品信息" min-width="220">
              <template #default="detailScope">
                <div>{{ detailScope.row.itemName || '-' }}</div>
                <div v-if="detailScope.row.itemCode" class="text-12px text-gray-500">
                  商品编号：{{ detailScope.row.itemCode }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="规格信息" min-width="220">
              <template #default="detailScope">
                <div>{{ detailScope.row.skuName || '-' }}</div>
                <div v-if="detailScope.row.skuCode" class="text-12px text-gray-500">
                  规格编号：{{ detailScope.row.skuCode }}
                </div>
              </template>
            </el-table-column>
            <el-table-column align="right" label="账面数量" width="120">
              <template #default="detailScope">
                {{ formatQuantity(detailScope.row.quantity) }}
              </template>
            </el-table-column>
            <el-table-column align="right" label="实盘数量" width="120">
              <template #default="detailScope">
                {{ formatQuantity(detailScope.row.checkQuantity) }}
              </template>
            </el-table-column>
            <el-table-column align="right" label="单价(元)" width="120">
              <template #default="detailScope">
                {{ formatPrice(detailScope.row.price) }}
              </template>
            </el-table-column>
            <el-table-column align="right" label="实际金额(元)" width="140">
              <template #default="detailScope">
                {{ formatPrice(getDetailActualPrice(detailScope.row)) }}
              </template>
            </el-table-column>
            <el-table-column align="right" label="盈亏数量" width="120">
              <template #default="detailScope">
                <span :class="getLossClass(getDetailDifferenceQuantity(detailScope.row))">
                  {{ formatQuantity(getDetailDifferenceQuantity(detailScope.row)) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column align="right" label="实际盈亏金额(元)" width="160">
              <template #default="detailScope">
                <span :class="getLossClass(getDetailDifferencePrice(detailScope.row))">
                  {{ formatPrice(getDetailDifferencePrice(detailScope.row)) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column v-if="isTableColumnVisible('no')" fixed="left" label="单号" width="210">
        <template #default="scope">
          单号：
          <el-button link type="primary" @click="openDetail(scope.row.id)">
            {{ scope.row.no }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('status')"
        align="center"
        fixed="left"
        label="盘库状态"
        width="110"
      >
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.WMS_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column v-if="isTableColumnVisible('warehouse')" label="仓库" min-width="180">
        <template #default="scope">
          {{ scope.row.warehouseName || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('quantityAmount')"
        label="盈亏/金额(元)"
        min-width="200"
      >
        <template #default="scope">
          <div class="flex items-center justify-between">
            <span>盈亏数：</span>
            <span :class="getLossClass(scope.row.totalQuantity)">{{
              formatQuantity(scope.row.totalQuantity)
            }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>总金额：</span>
            <span>{{ formatPrice(scope.row.totalPrice) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>实际金额：</span>
            <span>{{ formatPrice(scope.row.actualPrice) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>盈亏金额：</span>
            <span :class="getLossClass(getDifferencePrice(scope.row))">{{
              formatPrice(getDifferencePrice(scope.row))
            }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-if="isTableColumnVisible('operateInfo')" label="操作信息" min-width="280">
        <template #default="scope">
          <div>
            创建：{{ formatNullableDate(scope.row.createTime) }} /
            {{ scope.row.creatorName || scope.row.creator || '-' }}
          </div>
          <div>
            更新：{{ formatNullableDate(scope.row.updateTime) }} /
            {{ scope.row.updaterName || scope.row.updater || '-' }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('remark')"
        label="备注"
        min-width="160"
        prop="remark"
      />
      <el-table-column align="center" fixed="right" label="操作" width="150">
        <template #default="scope">
          <el-tooltip
            :content="getCheckOrderUpdateTip(scope.row.status)"
            :disabled="canUpdateCheckOrder(scope.row.status)"
            placement="top"
          >
            <span>
              <el-button
                v-hasPermi="['wms:check-order:update']"
                :disabled="!canUpdateCheckOrder(scope.row.status)"
                link
                type="primary"
                @click="openForm('update', scope.row.id)"
              >
                修改
              </el-button>
            </span>
          </el-tooltip>
          <el-tooltip
            :content="getCheckOrderDeleteTip(scope.row.status)"
            :disabled="canDeleteCheckOrder(scope.row.status)"
            placement="top"
          >
            <span>
              <el-button
                v-hasPermi="['wms:check-order:delete']"
                :disabled="!canDeleteCheckOrder(scope.row.status)"
                link
                type="danger"
                @click="handleDelete(scope.row.id)"
              >
                删除
              </el-button>
            </span>
          </el-tooltip>
          <el-button
            v-hasPermi="['wms:check-order:query']"
            link
            type="primary"
            @click="handlePrint(scope.row.id)"
          >
            打印
          </el-button>
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

  <!-- 表单弹窗：添加/修改 -->
  <CheckOrderForm ref="formRef" @success="getList" />
  <CheckOrderDetail ref="detailRef" />
  <CheckOrderPrint ref="printRef" />
</template>

<script lang="ts" setup>
import { defaultShortcuts, formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CheckOrderApi, CheckOrderVO } from '@/api/wms/order/check'
import { CheckOrderDetailVO } from '@/api/wms/order/check/detail'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import {
  OrderDeleteStatusList,
  OrderStatusEnum,
  OrderUpdateStatusList
} from '@/views/wms/utils/constants'
import {
  formatPrice,
  formatQuantity,
  getLossClass,
  PRICE_PRECISION,
  QUANTITY_PRECISION,
  roundPrice
} from '@/views/wms/utils/format'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import CheckOrderDetail from './CheckOrderDetail.vue'
import CheckOrderForm from './CheckOrderForm.vue'
import CheckOrderPrint from './CheckOrderPrint.vue'
import download from '@/utils/download'

/** WMS 盘库单 */
defineOptions({ name: 'WmsCheckOrder' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

type TableColumnKey = 'no' | 'status' | 'warehouse' | 'quantityAmount' | 'operateInfo' | 'remark'

const tableColumnOptions: Array<{ label: string; value: TableColumnKey }> = [
  { label: '单号', value: 'no' },
  { label: '盘库状态', value: 'status' },
  { label: '仓库', value: 'warehouse' },
  { label: '盈亏/金额', value: 'quantityAmount' },
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

const loading = ref(true) // 列表的加载中
const list = ref<CheckOrderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数

/** 获得默认的查询参数 */
function getDefaultQueryParams() {
  return {
    pageNo: 1,
    pageSize: 10,
    no: undefined as string | undefined,
    status: undefined as number | undefined,
    warehouseId: undefined as number | undefined,
    orderTime: undefined as string[] | undefined,
    totalQuantityMin: undefined as number | undefined,
    totalQuantityMax: undefined as number | undefined,
    totalPriceMin: undefined as number | undefined,
    totalPriceMax: undefined as number | undefined,
    actualPriceMin: undefined as number | undefined,
    actualPriceMax: undefined as number | undefined,
    creator: undefined as number | undefined,
    updater: undefined as number | undefined,
    createTime: undefined as string[] | undefined,
    updateTime: undefined as string[] | undefined
  }
}
const queryParams = reactive(getDefaultQueryParams())
const exportLoading = ref(false) // 导出的加载中
const detailMap = reactive<Record<number, CheckOrderDetailVO[]>>({}) // 盘库单明细数据

/** 判断表格列是否可见 */
function isTableColumnVisible(column: TableColumnKey) {
  return checkedTableColumns.value.includes(column)
}

/** 是否允许修改盘库单 */
const canUpdateCheckOrder = (status?: number) => {
  return status !== undefined && OrderUpdateStatusList.includes(status)
}

/** 是否允许删除盘库单 */
const canDeleteCheckOrder = (status?: number) => {
  return status !== undefined && OrderDeleteStatusList.includes(status)
}

/** 获得盘库单修改禁用提示 */
const getCheckOrderUpdateTip = (status?: number) => {
  if (status === OrderStatusEnum.FINISHED) {
    return '已盘库，无法修改'
  }
  if (status === OrderStatusEnum.CANCELED) {
    return '已作废，无法修改'
  }
  return '当前状态无法修改'
}

/** 获得盘库单删除禁用提示 */
const getCheckOrderDeleteTip = (status?: number) => {
  if (status === OrderStatusEnum.FINISHED) {
    return '已盘库，无法删除'
  }
  return '当前状态无法删除'
}

/** 计算盘库单盈亏金额 */
const getDifferencePrice = (row: CheckOrderVO) => {
  return roundPrice(Number(row.actualPrice || 0) - Number(row.totalPrice || 0))
}

/** 计算明细盈亏数量 */
const getDetailDifferenceQuantity = (detail: CheckOrderDetailVO) => {
  return Number(detail.checkQuantity || 0) - Number(detail.quantity || 0)
}

/** 计算明细实际金额 */
const getDetailActualPrice = (detail: CheckOrderDetailVO) => {
  if (
    detail.checkQuantity === undefined ||
    detail.checkQuantity === null ||
    detail.price === undefined ||
    detail.price === null
  ) {
    return undefined
  }
  return roundPrice(Number(detail.checkQuantity) * Number(detail.price))
}

/** 计算明细盈亏金额 */
const getDetailDifferencePrice = (detail: CheckOrderDetailVO) => {
  if (detail.price === undefined || detail.price === null) {
    return undefined
  }
  return roundPrice(getDetailDifferenceQuantity(detail) * Number(detail.price))
}

/** 查询盘库单列表 */
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

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  Object.assign(queryParams, getDefaultQueryParams())
  handleQuery()
}

/** 展开明细 */
const handleExpandChange = async (row: CheckOrderVO, expandedRows: CheckOrderVO[]) => {
  if (!row.id || !expandedRows.some((item) => item.id === row.id)) {
    return
  }
  delete detailMap[row.id]
  detailMap[row.id] = await CheckOrderApi.getCheckOrderDetailListByOrderId(row.id)
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 查看盘库单详情 */
const detailRef = ref()
const openDetail = (id: number) => {
  detailRef.value.open(id)
}

/** 打印盘库单 */
const printRef = ref()
const handlePrint = (id: number) => {
  printRef.value.print(id)
}

/** 删除盘库单 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await CheckOrderApi.deleteCheckOrder(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await CheckOrderApi.exportCheckOrder(queryParams)
    download.excel(data, '盘库单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
