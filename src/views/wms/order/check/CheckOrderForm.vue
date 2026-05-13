<!-- WMS 盘库单表单 -->
<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="1280px">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="92px">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="盘库单号" prop="no">
            <el-input v-model="formData.no" maxlength="64" placeholder="请输入盘库单号" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WarehouseSelect v-model="formData.warehouseId" @change="handleWarehouseChange" />
          </el-form-item>
        </el-col>
        <el-col v-if="AREA_ENABLE" :span="8">
          <el-form-item label="库区" prop="areaId">
            <WarehouseAreaSelect v-model="formData.areaId" :warehouse-id="formData.warehouseId" @change="handleAreaChange" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="盈亏数量">
            <el-input :model-value="formatQuantity(totalQuantity)" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="总金额">
            <el-input-number
              v-model="formData.totalAmount"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1"
              placeholder="请输入总金额"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" maxlength="255" placeholder="请输入备注" :rows="3" type="textarea" />
          </el-form-item>
        </el-col>
      </el-row>

      <div class="mb-12px flex items-center justify-between">
        <span class="text-14px font-bold">盘库明细</span>
        <el-tooltip content="请先选择仓库" :disabled="!!formData.warehouseId" placement="top">
          <span>
            <el-button :disabled="!formData.warehouseId" plain type="primary" @click="handleAddDetail">
              <Icon class="mr-5px" icon="ep:plus" />
              添加商品
            </el-button>
          </span>
        </el-tooltip>
      </div>
      <el-table :data="formData.details" border empty-text="暂无商品明细">
        <el-table-column label="商品信息" min-width="210">
          <template #default="{ row }">
            <div>{{ row.itemName || '-' }}</div>
            <div v-if="row.itemCode" class="text-12px text-gray-500">商品编号：{{ row.itemCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="规格信息" min-width="210">
          <template #default="{ row }">
            <div>{{ row.skuName || '-' }}</div>
            <div v-if="row.skuCode" class="text-12px text-gray-500">规格编号：{{ row.skuCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="批号" min-width="140" prop="batchNo" />
        <el-table-column align="right" label="账面数量" width="120">
          <template #default="{ row }">{{ formatQuantity(row.quantity) || '-' }}</template>
        </el-table-column>
        <el-table-column label="实盘数量" width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.checkQuantity"
              :controls="false"
              :min="0"
              :precision="QUANTITY_PRECISION"
              class="!w-1/1"
              placeholder="数量"
            />
          </template>
        </el-table-column>
        <el-table-column align="right" label="盈亏数量" width="120">
          <template #default="{ row }">{{ formatQuantity(getDifferenceQuantity(row)) }}</template>
        </el-table-column>
        <el-table-column label="金额(元)" width="160">
          <template #default="{ row }">
            <el-input-number
              v-model="row.amount"
              :controls="false"
              :min="0"
              :precision="PRICE_PRECISION"
              class="!w-1/1"
              placeholder="金额"
              @change="refreshTotalAmount"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.remark" maxlength="255" placeholder="请输入备注" />
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
        :area-id="formData.areaId"
        :warehouse-id="formData.warehouseId"
        @change="handleSelectInventory"
      />
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
          <el-button v-if="isPrepareOrder" :disabled="formLoading" type="primary" @click="submitForm">保存</el-button>
          <el-button @click="dialogVisible = false">取 消</el-button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { FormRules } from 'element-plus'
import { CheckOrderApi, CheckOrderVO } from '@/api/wms/order/check'
import { CheckOrderDetailVO } from '@/api/wms/order/check/detail'
import InventorySelect, { InventorySelectRow } from '@/views/wms/inventory/components/InventorySelect.vue'
import WarehouseAreaSelect from '@/views/wms/md/warehouse/components/WarehouseAreaSelect.vue'
import WarehouseSelect from '@/views/wms/md/warehouse/components/WarehouseSelect.vue'
import { AREA_ENABLE } from '@/views/wms/utils/config'
import { OrderStatusEnum, OrderUpdateStatusList } from '@/views/wms/utils/constants'
import { formatQuantity, PRICE_PRECISION, QUANTITY_PRECISION, sumPrice } from '@/views/wms/utils/format'
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
const formData = ref<CheckOrderVO>({
  id: undefined,
  no: undefined,
  status: OrderStatusEnum.PREPARE,
  warehouseId: undefined,
  areaId: undefined,
  totalQuantity: 0,
  totalAmount: 0,
  remark: undefined,
  details: []
})
const formRules = reactive<FormRules>({
  no: [{ required: true, message: '盘库单号不能为空', trigger: 'blur' }],
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'change' }]
})
const formRef = ref()
const inventorySelectRef = ref()

const getDifferenceQuantity = (detail: CheckOrderDetailVO) => Number(detail.checkQuantity || 0) - Number(detail.quantity || 0)
const totalQuantity = computed(() =>
  (formData.value.details || []).reduce((sum, detail) => sum + getDifferenceQuantity(detail), 0)
)
const detailTotalAmount = computed(() => sumPrice(formData.value.details || [], (detail) => detail.amount))
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
  if (id) {
    formLoading.value = true
    try {
      const order = await CheckOrderApi.getCheckOrder(id)
      formData.value = { ...order, details: order.details || [] }
    } finally {
      formLoading.value = false
    }
  }
  originalFormData.value = JSON.stringify(buildSubmitData())
}
defineExpose({ open })

/** 构建盘库明细 */
const buildDetail = (inventory: InventorySelectRow): CheckOrderDetailVO => ({
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
  areaId: inventory.areaId,
  areaName: inventory.areaName,
  batchNo: inventory.batchNo,
  productionDate: inventory.productionDate,
  expirationDate: inventory.expirationDate,
  quantity: inventory.availableQuantity,
  checkQuantity: inventory.availableQuantity,
  availableQuantity: inventory.availableQuantity,
  amount: inventory.amount,
  remark: undefined
})

const handleAddDetail = () => inventorySelectRef.value?.open()
const handleSelectInventory = (inventories: InventorySelectRow[]) => {
  if (!inventories.length) return
  formData.value.details = formData.value.details || []
  inventories.forEach((inventory) => {
    if (isInventorySelected(inventory)) return
    formData.value.details!.push(buildDetail(inventory))
  })
  refreshTotalAmount()
}
const isInventorySelected = (inventory: InventorySelectRow) =>
  (formData.value.details || []).some((detail) => {
    return detail.inventoryId === inventory.id
  })
const handleDeleteDetail = (index: number) => {
  formData.value.details?.splice(index, 1)
  refreshTotalAmount()
}
const handleWarehouseChange = () => {
  formData.value.areaId = undefined
  formData.value.details = []
  refreshTotalAmount()
}
const handleAreaChange = () => {
  formData.value.details = []
  refreshTotalAmount()
}
const refreshTotalAmount = () => {
  formData.value.totalAmount = detailTotalAmount.value
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
    if (AREA_ENABLE && !detail.areaId) {
      message.error(`第 ${i + 1} 行明细请选择库区`)
      return false
    }
    if (detail.checkQuantity === undefined || detail.checkQuantity < 0) {
      message.error(`第 ${i + 1} 行明细实盘数量不能小于 0`)
      return false
    }
  }
  return true
}

/** 构建提交数据 */
const buildSubmitData = () =>
  ({
    ...formData.value,
    totalQuantity: totalQuantity.value,
    totalAmount: formData.value.totalAmount,
    details: formData.value.details || []
  }) as CheckOrderVO

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  if (!validateDetails(false)) return
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
  if (!validateDetails(true)) return
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
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    no: generateOrderNo('PK'),
    status: OrderStatusEnum.PREPARE,
    warehouseId: undefined,
    areaId: undefined,
    totalQuantity: 0,
    totalAmount: 0,
    remark: undefined,
    details: []
  }
  originalFormData.value = ''
  nextTick(() => formRef.value?.clearValidate())
}
</script>
