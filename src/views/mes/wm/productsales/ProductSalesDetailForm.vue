<!-- MES 销售出库拣货明细表单弹窗 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item label="物料" prop="itemId">
        <MdItemSelect v-model="formData.itemId" disabled />
      </el-form-item>
      <el-form-item label="选择库存" prop="materialStockId">
        <WmMaterialStockSelect
          v-model="formData.materialStockId"
          :item-id="formData.itemId"
          @change="handleStockChange"
        />
      </el-form-item>
      <el-form-item label="出库仓库" prop="warehouseId">
        <WmWarehouseSelect v-model="formData.warehouseId" />
      </el-form-item>
      <el-form-item label="库区" prop="locationId" v-if="formData.warehouseId">
        <WmWarehouseLocationSelect
          v-model="formData.locationId"
          :warehouse-id="formData.warehouseId"
        />
      </el-form-item>
      <el-form-item label="库位" prop="areaId" v-if="formData.locationId">
        <WmWarehouseAreaSelect v-model="formData.areaId" :location-id="formData.locationId" />
      </el-form-item>
      <el-form-item label="批次号" prop="batchId">
        <WmBatchSelect
          v-model="formData.batchId"
          :item-id="formData.itemId"
          @change="handleBatchChange"
        />
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :precision="2"
          :min="0"
          :max="quantityMax"
          controls-position="right"
          class="!w-1/1"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmProductSalesDetailApi, WmProductSalesDetailVO } from '@/api/mes/wm/productsales/detail'
import { WmMaterialStockVO } from '@/api/mes/wm/materialstock'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'
import WmBatchSelect from '@/views/mes/wm/batch/components/WmBatchSelect.vue'
import WmMaterialStockSelect from '@/views/mes/wm/materialstock/components/WmMaterialStockSelect.vue'

defineOptions({ name: 'ProductSalesDetailForm' })

const props = defineProps<{
  salesId: number
}>()

const emit = defineEmits(['success'])

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中
const formType = ref('') // 表单的类型：create / update
const currentLineId = ref<number>() // 当前操作的行 ID
const formRef = ref() // 表单 Ref
const formData = ref({
  id: undefined as number | undefined,
  lineId: undefined as number | undefined,
  salesId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  quantity: undefined as number | undefined,
  materialStockId: undefined as number | undefined,
  warehouseId: undefined as number | undefined,
  locationId: undefined as number | undefined,
  areaId: undefined as number | undefined,
  batchId: undefined as number | undefined,
  batchCode: undefined as string | undefined
})
const quantityMax = ref<number | undefined>(undefined) // 数量上限（在库数量）
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  materialStockId: [{ required: true, message: '请选择库存记录', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})

/** 打开弹窗 */
const open = async (type: string, lineId: number, itemId?: number, detailId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加拣货明细' : '编辑拣货明细'
  formType.value = type
  currentLineId.value = lineId
  resetForm()
  // 修改时，设置数据
  if (detailId) {
    formLoading.value = true
    try {
      formData.value = await WmProductSalesDetailApi.getProductSalesDetail(detailId)
    } finally {
      formLoading.value = false
    }
  } else if (itemId) {
    formData.value.itemId = itemId
  }
}
defineExpose({ open })

/** 批次选中回调，同步 batchCode */
const handleBatchChange = (batch: any) => {
  formData.value.batchCode = batch?.code
}

/** 库存选中回调 —— 自动回填仓库/库区/库位/批次/数量 */
const handleStockChange = (stock: WmMaterialStockVO | undefined) => {
  if (!stock) {
    formData.value.warehouseId = undefined
    formData.value.locationId = undefined
    formData.value.areaId = undefined
    formData.value.batchId = undefined
    formData.value.batchCode = undefined
    formData.value.quantity = undefined
    quantityMax.value = undefined
    return
  }
  formData.value.warehouseId = stock.warehouseId
  formData.value.locationId = stock.locationId
  formData.value.areaId = stock.areaId
  formData.value.batchId = stock.batchId
  formData.value.batchCode = stock.batchCode
  formData.value.quantity = stock.quantity
  quantityMax.value = stock.quantity
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      salesId: props.salesId,
      lineId: currentLineId.value
    } as unknown as WmProductSalesDetailVO
    if (formType.value === 'create') {
      await WmProductSalesDetailApi.createProductSalesDetail(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmProductSalesDetailApi.updateProductSalesDetail(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success', currentLineId.value)
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    lineId: undefined,
    salesId: undefined,
    itemId: undefined,
    quantity: undefined,
    materialStockId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    batchId: undefined,
    batchCode: undefined
  }
  quantityMax.value = undefined
  formRef.value?.resetFields()
}
</script>
