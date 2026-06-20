<!-- WMS 入库单 -->
<template>
  <doc-alert title="【单据】入库" url="https://doc.iocoder.cn/wms/order/receipt/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="80px"
    >
      <el-form-item label="入库单号" prop="no">
        <el-input
          v-model="queryParams.no"
          class="!w-240px"
          clearable
          placeholder="请输入入库单号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="业务单号" prop="bizOrderNo">
        <el-input
          v-model="queryParams.bizOrderNo"
          class="!w-240px"
          clearable
          placeholder="请输入业务单号"
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
        <WarehouseSelect
          v-model="queryParams.warehouseId"
          class="!w-240px"
          @change="handleWarehouseChange"
        />
      </el-form-item>
      <el-form-item label="供应商" prop="merchantId">
        <MerchantSelect
          v-model="queryParams.merchantId"
          class="!w-240px"
          placeholder="请选择供应商"
          supplier
        />
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
      <el-form-item label="数量" prop="totalQuantityMin">
        <div class="flex w-240px items-center gap-8px">
          <el-input-number
            v-model="queryParams.totalQuantityMin"
            :controls="false"
            :min="0"
            :precision="QUANTITY_PRECISION"
            class="!w-105px"
            placeholder="最小值"
          />
          <span>至</span>
          <el-input-number
            v-model="queryParams.totalQuantityMax"
            :controls="false"
            :min="0"
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
      <el-form-item label="入库类型" prop="type">
        <el-select
          v-model="queryParams.type"
          class="!w-240px"
          clearable
          placeholder="请选择入库类型"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.WMS_RECEIPT_ORDER_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
          v-hasPermi="['wms:receipt-order:create']"
          plain
          type="primary"
          @click="openForm('create')"
        >
          <Icon class="mr-5px" icon="ep:plus" />
          新增
        </el-button>
        <el-button
          v-hasPermi="['wms:receipt-order:export']"
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

  <!-- 入库单列表 -->
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
            <el-table-column align="right" label="入库数量" width="120">
              <template #default="detailScope">
                {{ formatQuantity(detailScope.row.quantity) }}
              </template>
            </el-table-column>
            <el-table-column align="right" label="单价(元)" width="120">
              <template #default="detailScope">
                {{ formatPrice(detailScope.row.price) || '-' }}
              </template>
            </el-table-column>
            <el-table-column align="right" label="金额(元)" width="120">
              <template #default="detailScope">
                {{ formatPrice(getDetailTotalPrice(detailScope.row)) || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('no')"
        fixed="left"
        label="单号/业务单号"
        width="290"
      >
        <template #default="scope">
          <div>
            单号：
            <el-button link type="primary" @click="openDetail(scope.row.id)">
              {{ scope.row.no }}
            </el-button>
          </div>
          <div v-if="scope.row.bizOrderNo" class="text-12px text-gray-500">
            业务：{{ scope.row.bizOrderNo }}
          </div>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('status')"
        align="center"
        fixed="left"
        label="入库状态"
        width="110"
      >
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.WMS_ORDER_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('type')"
        align="center"
        label="入库类型"
        width="120"
      >
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.WMS_RECEIPT_ORDER_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column v-if="isTableColumnVisible('warehouse')" label="仓库" min-width="160">
        <template #default="scope">
          {{ scope.row.warehouseName || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('quantityAmount')"
        label="总数量/总金额(元)"
        min-width="180"
      >
        <template #default="scope">
          <div class="flex items-center justify-between">
            <span>数量：</span>
            <span>{{ formatQuantity(scope.row.totalQuantity) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>金额：</span>
            <span>{{ formatPrice(scope.row.totalPrice) }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        v-if="isTableColumnVisible('merchant')"
        label="供应商"
        min-width="160"
        prop="merchantName"
      />
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
      <el-table-column align="center" fixed="right" label="操作" width="180">
        <template #default="scope">
          <el-tooltip
            :content="getReceiptOrderUpdateTip(scope.row.status)"
            :disabled="canUpdateReceiptOrder(scope.row.status)"
            placement="top"
          >
            <span>
              <el-button
                v-hasPermi="['wms:receipt-order:update']"
                :disabled="!canUpdateReceiptOrder(scope.row.status)"
                link
                type="primary"
                @click="openForm('update', scope.row.id)"
              >
                修改
              </el-button>
            </span>
          </el-tooltip>
          <el-tooltip
            :content="getReceiptOrderDeleteTip(scope.row.status)"
            :disabled="canDeleteReceiptOrder(scope.row.status)"
            placement="top"
          >
            <span>
              <el-button
                v-hasPermi="['wms:receipt-order:delete']"
                :disabled="!canDeleteReceiptOrder(scope.row.status)"
                link
                type="danger"
                @click="handleDelete(scope.row.id)"
              >
                删除
              </el-button>
            </span>
          </el-tooltip>
          <el-button
            v-hasPermi="['wms:receipt-order:query']"
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
  <ReceiptOrderForm ref="formRef" @success="getList" />
  <ReceiptOrderDetail ref="detailRef" />
  <ReceiptOrderPrint ref="printRef" />
</template>

<script lang="ts" setup>
import { defaultShortcuts, formatNullableDate } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { ReceiptOrderApi, ReceiptOrderVO } from '@/api/wms/order/receipt'
import { ReceiptOrderDetailVO } from '@/api/wms/order/receipt/detail'
import MerchantSelect from '@/views/wms/md/merchant/components/MerchantSelect.vue'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import {
  OrderDeleteStatusList,
  OrderStatusEnum,
  OrderUpdateStatusList
} from '@/views/wms/utils/constants'
import {
  formatPrice,
  formatQuantity,
  multiplyPrice,
  PRICE_PRECISION,
  QUANTITY_PRECISION
} from '@/views/wms/utils/format'
import UserSelectV2 from '@/views/system/user/components/UserSelectV2.vue'
import ReceiptOrderDetail from './ReceiptOrderDetail.vue'
import ReceiptOrderForm from './ReceiptOrderForm.vue'
import ReceiptOrderPrint from './ReceiptOrderPrint.vue'
import download from '@/utils/download'

/** WMS 入库单 */
defineOptions({ name: 'WmsReceiptOrder' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

type TableColumnKey =
  | 'no'
  | 'status'
  | 'type'
  | 'warehouse'
  | 'quantityAmount'
  | 'merchant'
  | 'operateInfo'
  | 'remark'

const tableColumnOptions: Array<{ label: string; value: TableColumnKey }> = [
  { label: '单号/业务单号', value: 'no' },
  { label: '入库状态', value: 'status' },
  { label: '入库类型', value: 'type' },
  { label: '仓库', value: 'warehouse' },
  { label: '数量/金额(元)', value: 'quantityAmount' },
  { label: '供应商', value: 'merchant' },
  { label: '操作信息', value: 'operateInfo' },
  { label: '备注', value: 'remark' }
]
const checkedTableColumns = ref<TableColumnKey[]>([
  'no',
  'status',
  'type',
  'warehouse',
  'quantityAmount',
  'merchant',
  'operateInfo',
  'remark'
])

const loading = ref(true) // 列表的加载中
const list = ref<ReceiptOrderVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数

/** 获得默认的查询参数 */
function getDefaultQueryParams() {
  return {
    pageNo: 1,
    pageSize: 10,
    no: undefined as string | undefined,
    status: undefined as number | undefined,
    warehouseId: undefined as number | undefined,
    merchantId: undefined as number | undefined,
    orderTime: undefined as string[] | undefined,
    totalQuantityMin: undefined as number | undefined,
    totalQuantityMax: undefined as number | undefined,
    totalPriceMin: undefined as number | undefined,
    totalPriceMax: undefined as number | undefined,
    type: undefined as number | undefined,
    bizOrderNo: undefined as string | undefined,
    creator: undefined as number | undefined,
    updater: undefined as number | undefined,
    createTime: undefined as string[] | undefined,
    updateTime: undefined as string[] | undefined
  }
}
const queryParams = reactive(getDefaultQueryParams())
const exportLoading = ref(false) // 导出的加载中
const detailMap = reactive<Record<number, ReceiptOrderDetailVO[]>>({}) // 入库单明细数据

/** 判断表格列是否可见 */
function isTableColumnVisible(column: TableColumnKey) {
  return checkedTableColumns.value.includes(column)
}

/** 是否允许修改入库单 */
const canUpdateReceiptOrder = (status?: number) => {
  return status !== undefined && OrderUpdateStatusList.includes(status)
}

/** 是否允许删除入库单 */
const canDeleteReceiptOrder = (status?: number) => {
  return status !== undefined && OrderDeleteStatusList.includes(status)
}

/** 获得入库单修改禁用提示 */
const getReceiptOrderUpdateTip = (status?: number) => {
  if (status === OrderStatusEnum.FINISHED) {
    return '已入库，无法修改'
  }
  if (status === OrderStatusEnum.CANCELED) {
    return '已作废，无法修改'
  }
  return '当前状态无法修改'
}

/** 获得入库单删除禁用提示 */
const getReceiptOrderDeleteTip = (status?: number) => {
  if (status === OrderStatusEnum.FINISHED) {
    return '已入库，无法删除'
  }
  return '当前状态无法删除'
}

/** 查询入库单列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await ReceiptOrderApi.getReceiptOrderPage(queryParams)
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

/** 仓库变化 */
const handleWarehouseChange = () => {
  handleQuery()
}

/** 计算明细金额 */
const getDetailTotalPrice = (detail: ReceiptOrderDetailVO) => {
  if (detail.totalPrice !== undefined && detail.totalPrice !== null) {
    return detail.totalPrice
  }
  return multiplyPrice(detail.quantity, detail.price)
}

/** 展开明细 */
const handleExpandChange = async (row: ReceiptOrderVO, expandedRows: ReceiptOrderVO[]) => {
  if (!row.id || !expandedRows.some((item) => item.id === row.id)) {
    return
  }
  delete detailMap[row.id]
  detailMap[row.id] = await ReceiptOrderApi.getReceiptOrderDetailListByOrderId(row.id)
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 查看入库单详情 */
const detailRef = ref()
const openDetail = (id: number) => {
  detailRef.value.open(id)
}

/** 打印入库单 */
const printRef = ref()
const handlePrint = (id: number) => {
  printRef.value.print(id)
}

/** 删除入库单 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await ReceiptOrderApi.deleteReceiptOrder(id)
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
    const data = await ReceiptOrderApi.exportReceiptOrder(queryParams)
    download.excel(data, '入库单.xls')
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
