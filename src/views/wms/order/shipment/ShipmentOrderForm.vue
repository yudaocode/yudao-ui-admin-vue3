<!-- WMS 出库单表单 -->
<template>
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
          <el-form-item label="出库单号" prop="no">
            <el-input v-model="formData.no" maxlength="64" placeholder="请输入出库单号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="出库类型" prop="type">
            <el-select v-model="formData.type" class="w-1/1" placeholder="请选择出库类型">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.WMS_SHIPMENT_ORDER_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WarehouseSelect v-model="formData.warehouseId" @change="handleWarehouseChange" />
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
          <el-form-item label="客户" prop="merchantId">
            <MerchantSelect v-model="formData.merchantId" placeholder="请选择客户" customer />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="业务单号" prop="bizOrderNo">
            <el-input v-model="formData.bizOrderNo" maxlength="64" placeholder="请输入业务单号" />
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
        <span class="text-14px font-bold">出库明细</span>
        <el-tooltip content="请先选择仓库" :disabled="!!formData.warehouseId" placement="top">
          <span>
            <el-button
              :disabled="!formData.warehouseId"
              plain
              type="primary"
              @click="handleAddDetail"
            >
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
        <el-table-column label="商品信息" min-width="220">
          <template #default="scope">
            <div>{{ scope.row.itemName || '-' }}</div>
            <div v-if="scope.row.itemCode" class="text-12px text-gray-500">
              商品编号：{{ scope.row.itemCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="规格信息" min-width="220">
          <template #default="scope">
            <div>{{ scope.row.skuName || '-' }}</div>
            <div v-if="scope.row.skuCode" class="text-12px text-gray-500">
              规格编号：{{ scope.row.skuCode }}
            </div>
          </template>
        </el-table-column>
        <el-table-column align="right" label="可用库存" width="120">
          <template #default="scope">
            {{ formatQuantity(scope.row.availableQuantity) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="出库数量" prop="quantity" width="160">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.quantity"
              :controls="false"
              :min="0"
              :precision="QUANTITY_PRECISION"
              class="!w-1/1"
              placeholder="数量"
              @change="handleDetailQuantityChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="单价(元)" prop="price" width="160">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.price"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1"
              placeholder="单价"
              @change="handleDetailPriceChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" prop="totalPrice" width="160">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.totalPrice"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1"
              placeholder="金额"
              @change="handleDetailTotalPriceChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="操作" width="80">
          <template #default="scope">
            <el-button link type="danger" @click="handleDeleteDetail(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <InventorySelect
        ref="inventorySelectRef"
        :warehouse-id="formData.warehouseId"
        @change="handleSelectInventory"
      />
    </el-form>
    <template #footer>
      <div class="flex items-center justify-between">
        <div>
          <el-button
            v-if="isSavedPrepareOrder"
            v-hasPermi="['wms:shipment-order:complete']"
            :disabled="formLoading"
            type="success"
            @click="handleComplete"
          >
            完成出库
          </el-button>
          <el-button
            v-if="isSavedPrepareOrder"
            v-hasPermi="['wms:shipment-order:cancel']"
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { ShipmentOrderApi, ShipmentOrderVO } from '@/api/wms/order/shipment'
import { ShipmentOrderDetailVO } from '@/api/wms/order/shipment/detail'
import InventorySelect, {
  InventorySelectRow
} from '@/views/wms/inventory/components/InventorySelect.vue'
import MerchantSelect from '@/views/wms/md/merchant/components/MerchantSelect.vue'
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

/** WMS 出库单表单 */
defineOptions({ name: 'WmsShipmentOrderForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const originalFormData = ref('') // 表单原始数据快照
const formData = ref<ShipmentOrderVO>({
  id: undefined,
  no: undefined,
  type: undefined,
  orderTime: undefined,
  status: OrderStatusEnum.PREPARE,
  bizOrderNo: undefined,
  merchantId: undefined,
  warehouseId: undefined,
  remark: undefined,
  details: []
})
const formRules = reactive<FormRules>({
  no: [{ required: true, message: '出库单号不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '出库类型不能为空', trigger: 'change' }],
  orderTime: [{ required: true, message: '单据日期不能为空', trigger: 'change' }],
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref
const inventorySelectRef = ref() // 库存选择弹窗 Ref

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
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      const order = await ShipmentOrderApi.getShipmentOrder(id)
      formData.value = {
        ...order,
        details: normalizeDetails(order.details || [])
      }
    } finally {
      formLoading.value = false
    }
  }
  originalFormData.value = JSON.stringify(buildSubmitData())
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 构建出库明细 */
function buildDetail(inventory: InventorySelectRow): ShipmentOrderDetailVO {
  return {
    id: undefined,
    itemId: inventory.itemId,
    itemCode: inventory.itemCode,
    itemName: inventory.itemName,
    unit: inventory.unit,
    skuId: inventory.skuId,
    skuCode: inventory.skuCode,
    skuName: inventory.skuName,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouseName,
    quantity: undefined,
    availableQuantity: inventory.availableQuantity,
    price: undefined,
    totalPrice: undefined
  }
}

function normalizeDetails(details: ShipmentOrderDetailVO[]) {
  return details.map((detail) => ({
    ...detail,
    totalPrice: detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price)
  }))
}

/** 添加商品 */
const handleAddDetail = () => {
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
const isInventorySelected = (inventory: InventorySelectRow) => {
  return (formData.value.details || []).some((detail) => {
    return detail.skuId === inventory.skuId && detail.warehouseId === inventory.warehouseId
  })
}

/** 获得已选择的库存标识 */
const getSelectedInventoryKeys = () => {
  return (formData.value.details || [])
    .map((detail) =>
      detail.skuId && detail.warehouseId ? `${detail.skuId}-${detail.warehouseId}` : undefined
    )
    .filter((key): key is string => !!key)
}

/** 删除明细 */
const handleDeleteDetail = (index: number) => {
  formData.value.details?.splice(index, 1)
}

/** 仓库变化 */
const handleWarehouseChange = () => {
  formData.value.details = []
}

/** 明细数量变化 */
const handleDetailQuantityChange = (detail: ShipmentOrderDetailVO) => {
  if (detail.price !== undefined && detail.price !== null) {
    detail.totalPrice = multiplyPrice(detail.quantity, detail.price)
    return
  }
  detail.price = dividePrice(detail.totalPrice, detail.quantity)
}

/** 明细单价变化 */
const handleDetailPriceChange = (detail: ShipmentOrderDetailVO) => {
  detail.totalPrice = multiplyPrice(detail.quantity, detail.price)
}

/** 明细金额变化 */
const handleDetailTotalPriceChange = (detail: ShipmentOrderDetailVO) => {
  detail.price = dividePrice(detail.totalPrice, detail.quantity)
}

/** 计算表格的合计行数据 */
function getDetailSummaries({ columns, data }: { columns: any[]; data: ShipmentOrderDetailVO[] }) {
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
  if (!formData.value.details?.length) {
    if (required) {
      message.error('至少包含一条出库明细')
      return false
    }
    return true
  }
  for (let i = 0; i < formData.value.details.length; i++) {
    const detail = formData.value.details[i]
    if (!detail.skuId) {
      message.error(`第 ${i + 1} 行明细请选择商品规格`)
      return false
    }
    if (!detail.quantity || detail.quantity <= 0) {
      message.error(`第 ${i + 1} 行明细出库数量必须大于 0`)
      return false
    }
    if (detail.availableQuantity !== undefined && detail.quantity > detail.availableQuantity) {
      message.error(`第 ${i + 1} 行明细出库数量不能大于可用库存`)
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
  } as ShipmentOrderVO
}

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  if (!validateDetails(false)) {
    return
  }
  // 提交请求
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formType.value === 'create') {
      await ShipmentOrderApi.createShipmentOrder(data)
      message.success(t('common.createSuccess'))
    } else {
      await ShipmentOrderApi.updateShipmentOrder(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 完成出库：表单修改过则先保存，再完成 */
const handleComplete = async () => {
  await formRef.value.validate()
  if (!validateDetails(true)) {
    return
  }
  try {
    await message.confirm('确认完成出库？完成后将更新库存。')
    formLoading.value = true
    const data = buildSubmitData()
    if (JSON.stringify(data) !== originalFormData.value) {
      await ShipmentOrderApi.updateShipmentOrder(data)
    }
    await ShipmentOrderApi.completeShipmentOrder(formData.value.id!)
    message.success('出库成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 作废出库单 */
const handleCancel = async () => {
  try {
    await message.confirm('确认作废该出库单？作废后不可恢复。')
    formLoading.value = true
    await ShipmentOrderApi.cancelShipmentOrder(formData.value.id!)
    message.success('作废成功')
    dialogVisible.value = false
    emit('success')
  } catch {
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    no: generateOrderNo('CK'),
    type: undefined,
    orderTime: undefined,
    status: OrderStatusEnum.PREPARE,
    bizOrderNo: undefined,
    merchantId: undefined,
    warehouseId: undefined,
    remark: undefined,
    details: []
  }
  originalFormData.value = ''
  nextTick(() => formRef.value?.clearValidate())
}
</script>
