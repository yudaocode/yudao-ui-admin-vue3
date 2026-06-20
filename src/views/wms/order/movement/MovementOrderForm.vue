<!-- WMS 移库单表单 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1280px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="98px"
    >
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="移库单号" prop="no">
            <el-input v-model="formData.no" maxlength="64" placeholder="请输入移库单号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="来源仓库" prop="sourceWarehouseId">
            <WarehouseSelect
              v-model="formData.sourceWarehouseId"
              @change="handleSourceWarehouseChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="目标仓库" prop="targetWarehouseId">
            <WarehouseSelect
              v-model="formData.targetWarehouseId"
              @change="handleTargetWarehouseChange"
            />
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
        <span class="text-14px font-bold">移库明细</span>
        <el-tooltip content="请先选择来源仓库和目标仓库" :disabled="canAddDetail" placement="top">
          <span>
            <el-button :disabled="!canAddDetail" plain type="primary" @click="handleAddDetail">
              <Icon class="mr-5px" icon="ep:plus" />
              添加商品
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
        <el-table-column align="right" label="可用库存" width="120">
          <template #default="{ row }">{{ formatQuantity(row.availableQuantity) || '-' }}</template>
        </el-table-column>
        <el-table-column label="移库数量" prop="quantity" width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.quantity"
              :controls="false"
              :min="0"
              :precision="QUANTITY_PRECISION"
              class="!w-1/1"
              placeholder="数量"
              @change="handleDetailQuantityChange(row)"
            />
          </template>
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
        <el-table-column label="金额(元)" prop="totalPrice" width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.totalPrice"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1"
              placeholder="金额"
              @change="handleDetailTotalPriceChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作" width="80">
          <template #default="{ $index }">
            <el-button link type="danger" @click="handleDeleteDetail($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <InventorySelect
        ref="inventorySelectRef"
        :warehouse-id="formData.sourceWarehouseId"
        @change="handleSelectInventory"
      />
    </el-form>
    <template #footer>
      <div class="flex items-center justify-between">
        <div>
          <el-button
            v-if="isSavedPrepareOrder"
            v-hasPermi="['wms:movement-order:complete']"
            :disabled="formLoading"
            type="success"
            @click="handleComplete"
          >
            完成移库
          </el-button>
          <el-button
            v-if="isSavedPrepareOrder"
            v-hasPermi="['wms:movement-order:cancel']"
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
import { MovementOrderApi, MovementOrderVO } from '@/api/wms/order/movement'
import { MovementOrderDetailVO } from '@/api/wms/order/movement/detail'
import InventorySelect, {
  InventorySelectRow
} from '@/views/wms/inventory/components/InventorySelect.vue'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import { OrderStatusEnum, OrderUpdateStatusList } from '@/views/wms/utils/constants'
import {
  dividePrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  multiplyPrice,
  PRICE_PRECISION,
  QUANTITY_PRECISION
} from '@/views/wms/utils/format'
import { generateOrderNo } from '@/views/wms/utils/order'

/** WMS 移库单表单 */
defineOptions({ name: 'WmsMovementOrderForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const originalFormData = ref('')
const formData = ref<MovementOrderVO>({
  id: undefined,
  no: undefined,
  orderTime: undefined,
  status: OrderStatusEnum.PREPARE,
  sourceWarehouseId: undefined,
  targetWarehouseId: undefined,
  remark: undefined,
  details: []
})
const formRules = reactive<FormRules>({
  no: [{ required: true, message: '移库单号不能为空', trigger: 'blur' }],
  orderTime: [{ required: true, message: '单据日期不能为空', trigger: 'change' }],
  sourceWarehouseId: [{ required: true, message: '来源仓库不能为空', trigger: 'change' }],
  targetWarehouseId: [{ required: true, message: '目标仓库不能为空', trigger: 'change' }]
})
const formRef = ref()
const inventorySelectRef = ref()

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
const canAddDetail = computed(
  () => !!formData.value.sourceWarehouseId && !!formData.value.targetWarehouseId
)

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const order = await MovementOrderApi.getMovementOrder(id)
      formData.value = { ...order, details: normalizeDetails(order.details || []) }
    } finally {
      formLoading.value = false
    }
  }
  originalFormData.value = JSON.stringify(buildSubmitData())
}
defineExpose({ open })

/** 构建移库明细 */
function buildDetail(inventory: InventorySelectRow): MovementOrderDetailVO {
  return {
    id: undefined,
    itemId: inventory.itemId,
    itemCode: inventory.itemCode,
    itemName: inventory.itemName,
    unit: inventory.unit,
    skuId: inventory.skuId,
    skuCode: inventory.skuCode,
    skuName: inventory.skuName,
    sourceWarehouseId: inventory.warehouseId,
    sourceWarehouseName: inventory.warehouseName,
    targetWarehouseId: formData.value.targetWarehouseId,
    quantity: undefined,
    availableQuantity: inventory.availableQuantity,
    price: undefined,
    totalPrice: undefined
  }
}

function normalizeDetails(details: MovementOrderDetailVO[]) {
  return details.map((detail) => ({
    ...detail,
    totalPrice: detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price)
  }))
}

/** 打开库存选择弹窗 */
const handleAddDetail = () => {
  if (!canAddDetail.value) {
    return
  }
  inventorySelectRef.value?.open(getSelectedInventoryKeys())
}

/** 选择库存 */
const handleSelectInventory = (inventories: InventorySelectRow[]) => {
  if (!inventories.length) {
    return
  }
  formData.value.details = formData.value.details || []
  inventories.forEach((inventory) => {
    if (isInventorySelected(inventory)) {
      return
    }
    formData.value.details!.push(buildDetail(inventory))
  })
}

/** 判断库存是否已选择 */
function isInventorySelected(inventory: InventorySelectRow) {
  return (formData.value.details || []).some((detail) => {
    return detail.skuId === inventory.skuId && detail.sourceWarehouseId === inventory.warehouseId
  })
}

/** 获得已选择的库存标识 */
function getSelectedInventoryKeys() {
  return (formData.value.details || [])
    .map((detail) =>
      detail.skuId && detail.sourceWarehouseId
        ? `${detail.skuId}-${detail.sourceWarehouseId}`
        : undefined
    )
    .filter((key): key is string => !!key)
}

const handleDeleteDetail = (index: number) => {
  formData.value.details?.splice(index, 1)
}

const handleSourceWarehouseChange = () => {
  formData.value.details = []
}
const handleTargetWarehouseChange = () => {
  refreshTargetToDetails()
}
const refreshTargetToDetails = () => {
  const details = formData.value.details || []
  details.forEach((detail) => {
    detail.targetWarehouseId = formData.value.targetWarehouseId
  })
}

const handleDetailQuantityChange = (detail: MovementOrderDetailVO) => {
  if (detail.price !== undefined && detail.price !== null) {
    detail.totalPrice = multiplyPrice(detail.quantity, detail.price)
    return
  }
  detail.price = dividePrice(detail.totalPrice, detail.quantity)
}

const handleDetailPriceChange = (detail: MovementOrderDetailVO) => {
  detail.totalPrice = multiplyPrice(detail.quantity, detail.price)
}

const handleDetailTotalPriceChange = (detail: MovementOrderDetailVO) => {
  detail.price = dividePrice(detail.totalPrice, detail.quantity)
}

/** 计算表格的合计行数据 */
function getDetailSummaries({ columns, data }: { columns: any[]; data: MovementOrderDetailVO[] }) {
  return columns.map((column, index) => {
    if (index === 0) {
      return '合计'
    }
    if (column.property === 'quantity') {
      return formatSumQuantity(data, (detail) => detail.quantity)
    }
    if (column.property === 'totalPrice') {
      return formatSumPrice(data, (detail) => detail.totalPrice)
    }
    return ''
  })
}

/** 校验明细 */
const validateDetails = (required: boolean) => {
  if (formData.value.sourceWarehouseId === formData.value.targetWarehouseId) {
    message.error('来源仓库和目标仓库不能相同')
    return false
  }
  if (!formData.value.details?.length) {
    if (required) {
      message.error('至少包含一条移库明细')
      return false
    }
    return true
  }
  for (let i = 0; i < formData.value.details.length; i++) {
    const detail = formData.value.details[i]
    if (!detail.quantity || detail.quantity <= 0) {
      message.error(`第 ${i + 1} 行明细移库数量必须大于 0`)
      return false
    }
    if (detail.availableQuantity !== undefined && detail.quantity > detail.availableQuantity) {
      message.error(`第 ${i + 1} 行明细移库数量不能大于可用库存`)
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
    details,
    ...order
  } = formData.value
  return {
    ...order,
    details: details || []
  } as MovementOrderVO
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
      await MovementOrderApi.createMovementOrder(data)
      message.success(t('common.createSuccess'))
    } else {
      await MovementOrderApi.updateMovementOrder(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 完成移库：表单修改过则先保存，再完成 */
const handleComplete = async () => {
  await formRef.value.validate()
  if (!validateDetails(true)) {
    return
  }
  try {
    await message.confirm('确认完成移库？完成后将更新库存。')
    formLoading.value = true
    const data = buildSubmitData()
    if (JSON.stringify(data) !== originalFormData.value) {
      await MovementOrderApi.updateMovementOrder(data)
    }
    await MovementOrderApi.completeMovementOrder(formData.value.id!)
    message.success('移库成功')
    dialogVisible.value = false
    emit('success')
  } catch {
    // 用户点击确认框取消按钮、或网络异常时跳过
  } finally {
    formLoading.value = false
  }
}

/** 作废移库单 */
const handleCancel = async () => {
  try {
    await message.confirm('确认作废该移库单？作废后不可恢复。')
    formLoading.value = true
    await MovementOrderApi.cancelMovementOrder(formData.value.id!)
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
    no: generateOrderNo('YK'),
    orderTime: undefined,
    status: OrderStatusEnum.PREPARE,
    sourceWarehouseId: undefined,
    targetWarehouseId: undefined,
    remark: undefined,
    details: []
  }
  originalFormData.value = ''
  nextTick(() => formRef.value?.clearValidate())
}
</script>
