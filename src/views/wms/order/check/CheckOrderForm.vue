<!-- WMS 盘库单表单 -->
<template>
  <Dialog v-model="warehouseDialogVisible" title="选择盘库仓库" width="420px">
    <el-form
      ref="warehouseFormRef"
      :model="warehouseFormData"
      :rules="warehouseFormRules"
      label-width="80px"
    >
      <el-form-item label="仓库" prop="warehouseId">
        <WarehouseSelect v-model="warehouseFormData.warehouseId" @change="handleWarehouseSelect" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleStartCheck">开始盘库</el-button>
      <el-button @click="warehouseDialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1280px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="92px"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="盘库单号" prop="no">
            <el-input v-model="formData.no" maxlength="64" placeholder="请输入盘库单号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WarehouseSelect v-model="formData.warehouseId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单据日期" prop="orderTime">
            <el-date-picker
              v-model="formData.orderTime"
              class="!w-1/1"
              placeholder="请选择单据日期"
              type="date"
              value-format="x"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="实际金额">
            <el-input :model-value="formatPrice(actualPrice)" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              maxlength="255"
              placeholder="请输入备注"
              :rows="3"
              type="textarea"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="mb-12px flex items-center justify-between">
        <span class="text-14px font-bold">盘库明细</span>
        <el-tooltip content="请先选择仓库" :disabled="!!formData.warehouseId" placement="top">
          <span>
            <el-button
              :disabled="!formData.warehouseId"
              plain
              type="primary"
              @click="handleImportAllInventory"
            >
              <Icon class="mr-5px" icon="ep:download" />
              导入仓库库存
            </el-button>
            <el-button
              :disabled="!formData.warehouseId"
              plain
              type="primary"
              @click="handleAddSkuInventory"
            >
              <Icon class="mr-5px" icon="ep:plus" />
              添加盘点商品
            </el-button>
          </span>
        </el-tooltip>
      </div>
      <el-table
        :data="formData.details"
        :summary-method="getDetailSummaries"
        border
        empty-text="暂无商品明细"
        show-summary
      >
        <el-table-column label="商品信息" min-width="210">
          <template #default="{ row }">
            <div>{{ row.itemName || '-' }}</div>
            <div v-if="row.itemCode" class="text-12px text-gray-500">
              商品编号：{{ row.itemCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格信息" min-width="210">
          <template #default="{ row }">
            <div>{{ row.skuName || '-' }}</div>
            <div v-if="row.skuCode" class="text-12px text-gray-500">
              规格编号：{{ row.skuCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column align="right" label="账面库存" prop="quantity" width="120">
          <template #default="{ row }">{{ formatQuantity(row.quantity) || '-' }}</template>
        </el-table-column>
        <el-table-column label="单价(元)" prop="price" width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.price"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1"
              placeholder="单价"
              @change="handleDetailPriceChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="实际库存" prop="checkQuantity" width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.checkQuantity"
              :controls="false"
              :min="0"
              :precision="QUANTITY_PRECISION"
              class="!w-1/1"
              placeholder="数量"
              @change="handleDetailCheckQuantityChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="实际金额(元)" prop="actualPrice" width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.actualPrice"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1"
              placeholder="金额"
              @change="handleDetailActualPriceChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column align="right" label="盈亏数" prop="differenceQuantity" width="120">
          <template #default="{ row }">
            <span :class="getLossClass(getDifferenceQuantity(row))">{{
              formatQuantity(getDifferenceQuantity(row))
            }}</span>
          </template>
        </el-table-column>
        <el-table-column align="right" label="实际盈亏金额(元)" prop="differencePrice" width="160">
          <template #default="{ row }">
            <span :class="getLossClass(getDifferencePrice(row))">{{
              formatPrice(getDifferencePrice(row))
            }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作" width="80">
          <template #default="{ $index }">
            <el-button link type="danger" @click="handleDeleteDetail($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <ItemSkuSelect ref="skuSelectRef" @change="handleSelectSku" />
    </el-form>
    <template #footer>
      <div class="flex items-center justify-between">
        <div>
          <el-button
            v-if="isSavedPrepareOrder"
            v-hasPermi="['wms:check-order:complete']"
            :disabled="formLoading"
            type="success"
            @click="handleComplete"
          >
            完成盘库
          </el-button>
          <el-button
            v-if="isSavedPrepareOrder"
            v-hasPermi="['wms:check-order:cancel']"
            :disabled="formLoading"
            type="danger"
            @click="handleCancel"
          >
            作废
          </el-button>
        </div>
        <div>
          <el-button
            v-if="isPrepareOrder"
            :disabled="formLoading"
            type="primary"
            @click="submitForm"
          >
            保存
          </el-button>
          <el-button @click="dialogVisible = false">取 消</el-button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { FormRules } from 'element-plus'
import { h } from 'vue'
import { CheckOrderApi, CheckOrderVO } from '@/api/wms/order/check'
import { CheckOrderDetailVO } from '@/api/wms/order/check/detail'
import { InventoryApi, InventoryVO } from '@/api/wms/inventory'
import { ItemSkuVO } from '@/api/wms/md/item/sku'
import { WarehouseVO } from '@/api/wms/md/warehouse'
import ItemSkuSelect from '@/views/wms/md/item/sku/components/ItemSkuSelect.vue'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import { OrderStatusEnum, OrderUpdateStatusList } from '@/views/wms/utils/constants'
import {
  dividePrice,
  getLossClass,
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  multiplyPrice,
  PRICE_PRECISION,
  QUANTITY_PRECISION,
  roundPrice,
  sumPrice,
  sumQuantity
} from '@/views/wms/utils/format'
import { generateOrderNo } from '@/views/wms/utils/order'

/** WMS 盘库单表单 */
defineOptions({ name: 'WmsCheckOrderForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const originalFormData = ref('')
const warehouseDialogVisible = ref(false)

type CheckOrderFormDetail = CheckOrderDetailVO & { actualPrice?: number }
type CheckOrderFormData = Omit<CheckOrderVO, 'details'> & { details?: CheckOrderFormDetail[] }
type CheckInventoryRow = InventoryVO & { price?: number; availableQuantity?: number }

const formData = ref<CheckOrderFormData>({
  id: undefined,
  no: undefined,
  orderTime: undefined,
  status: OrderStatusEnum.PREPARE,
  warehouseId: undefined,
  remark: undefined,
  details: []
})
const formRules = reactive<FormRules>({
  no: [{ required: true, message: '盘库单号不能为空', trigger: 'blur' }],
  orderTime: [{ required: true, message: '单据日期不能为空', trigger: 'change' }],
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'change' }]
})
const formRef = ref()
const skuSelectRef = ref()
const warehouseFormRef = ref()
const warehouseFormData = reactive({
  warehouseId: undefined as number | undefined,
  warehouseName: undefined as string | undefined
})
const warehouseFormRules = reactive<FormRules>({
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'change' }]
})

function getDifferenceQuantity(detail: CheckOrderFormDetail) {
  return Number(detail.checkQuantity || 0) - Number(detail.quantity || 0)
}

function getBookPrice(detail: CheckOrderFormDetail) {
  return multiplyPrice(detail.quantity, detail.price)
}

function getActualPrice(detail: CheckOrderFormDetail) {
  return detail.actualPrice ?? multiplyPrice(detail.checkQuantity, detail.price)
}

function getDifferencePrice(detail: CheckOrderFormDetail) {
  if (detail.price === undefined || detail.price === null) {
    return undefined
  }
  return roundPrice(getDifferenceQuantity(detail) * Number(detail.price))
}

function renderLossText(
  value: number | string | null | undefined,
  formatter: (value?: number | string | null) => string
) {
  return h('span', { class: getLossClass(value) }, formatter(value))
}
const totalQuantity = computed(() =>
  sumQuantity(formData.value.details || [], (detail) => getDifferenceQuantity(detail))
)
const totalPrice = computed(() =>
  sumPrice(formData.value.details || [], (detail) => getBookPrice(detail))
)
const actualPrice = computed(() =>
  sumPrice(formData.value.details || [], (detail) => getActualPrice(detail))
)
const differencePrice = computed(() => roundPrice(actualPrice.value - totalPrice.value) || 0)
const isPrepareOrder = computed(
  () =>
    !formData.value.id ||
    (formData.value.status !== undefined && OrderUpdateStatusList.includes(formData.value.status))
)
const isSavedPrepareOrder = computed(
  () =>
    !!formData.value.id &&
    formData.value.status !== undefined &&
    OrderUpdateStatusList.includes(formData.value.status)
)

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  formType.value = type
  if (type === 'create') {
    dialogVisible.value = false
    resetForm()
    warehouseDialogVisible.value = true
    warehouseFormData.warehouseId = undefined
    warehouseFormData.warehouseName = undefined
    await nextTick()
    warehouseFormRef.value?.clearValidate()
    return
  }
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const order = await CheckOrderApi.getCheckOrder(id)
      formData.value = { ...order, details: normalizeDetails(order.details || []) }
    } finally {
      formLoading.value = false
    }
  }
  originalFormData.value = JSON.stringify(buildSubmitData())
}
defineExpose({ open })

/** 选择仓库后开始盘库 */
const handleStartCheck = async () => {
  await warehouseFormRef.value.validate()
  warehouseDialogVisible.value = false
  dialogVisible.value = true
  dialogTitle.value = t('action.create')
  resetForm()
  formData.value.warehouseId = warehouseFormData.warehouseId
  formData.value.warehouseName = warehouseFormData.warehouseName
  await nextTick()
  originalFormData.value = JSON.stringify(buildSubmitData())
}

/** 记录选中的盘库仓库 */
const handleWarehouseSelect = (warehouse: WarehouseVO | undefined) => {
  warehouseFormData.warehouseName = warehouse?.name
}

/** 构建盘库明细 */
function buildDetail(inventory: CheckInventoryRow): CheckOrderFormDetail {
  return {
    id: undefined,
    itemId: inventory.itemId,
    itemCode: inventory.itemCode,
    itemName: inventory.itemName,
    unit: inventory.unit,
    skuId: inventory.skuId,
    skuCode: inventory.skuCode,
    skuName: inventory.skuName,
    inventoryId: inventory.id,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouseName,
    quantity: inventory.availableQuantity,
    checkQuantity: inventory.availableQuantity,
    availableQuantity: inventory.availableQuantity,
    price: inventory.price,
    actualPrice: multiplyPrice(inventory.availableQuantity, inventory.price)
  }
}

function normalizeDetails(details: CheckOrderDetailVO[]) {
  return details.map((detail) => ({
    ...detail,
    actualPrice: multiplyPrice(detail.checkQuantity, detail.price)
  }))
}

/** 导入当前仓库的全部库存余额 */
const handleImportAllInventory = async () => {
  if (!formData.value.warehouseId) {
    message.warning('请先选择仓库')
    return
  }
  if (formData.value.details?.length) {
    await message.confirm('导入仓库库存会覆盖当前盘库明细，是否继续？')
  }
  formLoading.value = true
  try {
    const inventories = await loadWarehouseInventoryList()
    formData.value.details = inventories.map((inventory) =>
      buildDetail({ ...inventory, availableQuantity: inventory.quantity })
    )
  } finally {
    formLoading.value = false
  }
}

/** 打开盘点商品添加弹窗 */
const handleAddSkuInventory = () => {
  if (!formData.value.warehouseId) {
    message.warning('请先选择仓库')
    return
  }
  skuSelectRef.value?.open(getSelectedSkuIds(), { multiple: false })
}

/** 选择商品 SKU */
const handleSelectSku = async (skus: ItemSkuVO[]) => {
  if (!skus.length) {
    return
  }
  formLoading.value = true
  try {
    const warehouseInventoryMap = await getWarehouseInventoryMap()
    formData.value.details = formData.value.details || []
    const selectedSkuIds = new Set(getSelectedSkuIds())
    skus.forEach((sku) => {
      if (!sku.id || selectedSkuIds.has(sku.id)) {
        return
      }
      const inventory = warehouseInventoryMap.get(sku.id)
      formData.value.details!.push(
        inventory
          ? buildDetail({ ...inventory, availableQuantity: inventory.quantity })
          : buildZeroInventoryDetail(sku)
      )
      selectedSkuIds.add(sku.id)
    })
  } finally {
    formLoading.value = false
  }
}

/** 获得已选 SKU 编号 */
const getSelectedSkuIds = () => {
  return (formData.value.details || [])
    .map((detail) => detail.skuId)
    .filter((id): id is number => !!id)
}

/** 查询当前仓库全部库存余额 */
const loadWarehouseInventoryList = async (): Promise<InventoryVO[]> => {
  return await InventoryApi.getInventoryList({ warehouseId: formData.value.warehouseId! })
}

/** 获得当前仓库 SKU 对应库存余额 */
const getWarehouseInventoryMap = async (): Promise<Map<number, InventoryVO>> => {
  const inventories = await loadWarehouseInventoryList()
  return new Map(
    inventories
      .filter((inventory) => !!inventory.skuId)
      .map((inventory) => [inventory.skuId!, inventory] as const)
  )
}

/** 构建零库存盘库明细 */
function buildZeroInventoryDetail(sku: ItemSkuVO): CheckOrderFormDetail {
  return {
    id: undefined,
    itemId: sku.itemId,
    itemCode: sku.itemCode,
    itemName: sku.itemName,
    unit: sku.unit,
    skuId: sku.id,
    skuCode: sku.code,
    skuName: sku.name,
    inventoryId: undefined,
    warehouseId: formData.value.warehouseId,
    warehouseName: formData.value.warehouseName,
    quantity: 0,
    checkQuantity: 0,
    availableQuantity: 0,
    price: sku.costPrice,
    actualPrice: 0
  }
}

const handleDeleteDetail = (index: number) => {
  formData.value.details?.splice(index, 1)
}

const handleDetailCheckQuantityChange = (detail: CheckOrderFormDetail) => {
  if (detail.price !== undefined && detail.price !== null) {
    detail.actualPrice = multiplyPrice(detail.checkQuantity, detail.price)
    return
  }
  detail.price = dividePrice(detail.actualPrice, detail.checkQuantity)
}

const handleDetailPriceChange = (detail: CheckOrderFormDetail) => {
  detail.actualPrice = multiplyPrice(detail.checkQuantity, detail.price)
}

const handleDetailActualPriceChange = (detail: CheckOrderFormDetail) => {
  detail.price = dividePrice(detail.actualPrice, detail.checkQuantity)
}

/** 计算表格的合计行数据 */
function getDetailSummaries({ columns, data }: { columns: any[]; data: CheckOrderFormDetail[] }) {
  return columns.map((column, index) => {
    if (index === 0) {
      return '合计'
    }
    if (column.property === 'quantity') {
      return formatSumQuantity(data, (detail) => detail.quantity)
    }
    if (column.property === 'checkQuantity') {
      return formatSumQuantity(data, (detail) => detail.checkQuantity)
    }
    if (column.property === 'actualPrice') {
      return formatSumPrice(data, (detail) => getActualPrice(detail))
    }
    if (column.property === 'differenceQuantity') {
      return renderLossText(totalQuantity.value, formatQuantity)
    }
    if (column.property === 'differencePrice') {
      return renderLossText(differencePrice.value, formatPrice)
    }
    return ''
  })
}

/** 校验明细 */
const validateDetails = (required: boolean) => {
  if (!formData.value.details?.length) {
    if (required) {
      message.error('至少包含一条盘库明细')
      return false
    }
    return true
  }
  for (let i = 0; i < formData.value.details.length; i++) {
    const detail = formData.value.details[i]
    if (detail.checkQuantity === undefined || detail.checkQuantity < 0) {
      message.error(`第 ${i + 1} 行明细实盘数量不能小于 0`)
      return false
    }
  }
  return true
}

/** 构建提交数据 */
const buildSubmitData = () => {
  const {
    totalQuantity: _totalQuantity,
    totalPrice: _totalPrice,
    actualPrice: _actualPrice,
    details,
    ...order
  } = formData.value
  return {
    ...order,
    details: (details || []).map(
      ({ actualPrice: _rowActualPrice, availableQuantity: _availableQuantity, ...detail }) => detail
    )
  } as CheckOrderVO
}

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  if (!validateDetails(false)) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formType.value === 'create') {
      await CheckOrderApi.createCheckOrder(data)
      message.success(t('common.createSuccess'))
    } else {
      await CheckOrderApi.updateCheckOrder(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 完成盘库：表单修改过则先保存，再完成 */
const handleComplete = async () => {
  await formRef.value.validate()
  if (!validateDetails(true)) {
    return
  }
  try {
    await message.confirm('确认完成盘库？完成后将更新库存。')
    formLoading.value = true
    const data = buildSubmitData()
    if (JSON.stringify(data) !== originalFormData.value) {
      await CheckOrderApi.updateCheckOrder(data)
    }
    await CheckOrderApi.completeCheckOrder(formData.value.id!)
    message.success('盘库成功')
    dialogVisible.value = false
    emit('success')
  } catch {
    // 用户点击确认框取消按钮、或网络异常时跳过
  } finally {
    formLoading.value = false
  }
}

/** 作废盘库单 */
const handleCancel = async () => {
  try {
    await message.confirm('确认作废该盘库单？作废后不可恢复。')
    formLoading.value = true
    await CheckOrderApi.cancelCheckOrder(formData.value.id!)
    message.success('作废成功')
    dialogVisible.value = false
    emit('success')
  } catch {
    // 用户点击确认框取消按钮、或网络异常时跳过
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    no: generateOrderNo('PK'),
    orderTime: undefined,
    status: OrderStatusEnum.PREPARE,
    warehouseId: undefined,
    remark: undefined,
    details: []
  }
  originalFormData.value = ''
  nextTick(() => formRef.value?.clearValidate())
}
</script>
