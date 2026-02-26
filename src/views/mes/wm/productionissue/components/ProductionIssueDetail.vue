<!-- 生产领料单明细组件 - 用于 APPROVING/APPROVED 状态下显示拣货明细 -->
<!-- TODO @AI：参考 /Users/yunai/Java/yudao-all-in-one/yudao-ui-admin-vue3/src/views/mes/wm/arrivalnotice -->
<template>
  <div>
    <el-table :data="lines" border>
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="p-10px">
            <div class="mb-10px" v-if="canPick">
              <el-button type="primary" size="small" @click="handlePick(row)">
                <Icon icon="ep:plus" class="mr-5px" /> 拣货
              </el-button>
            </div>
            <el-table :data="row.details" border size="small">
              <el-table-column label="批次号" prop="batchCode" width="150" />
              <el-table-column label="仓库" prop="warehouseName" width="150" />
              <el-table-column label="库区" prop="locationName" width="150" />
              <el-table-column label="库位" prop="areaName" width="150" />
              <el-table-column label="拣货数量" prop="quantity" width="120" />
              <el-table-column label="操作" width="100" v-if="canPick">
                <template #default="scope">
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="handleDeleteDetail(row, scope.$index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="物料编号" prop="itemCode" width="150" />
      <el-table-column label="物料名称" prop="itemName" width="200" />
      <el-table-column label="规格型号" prop="specification" width="150" />
      <el-table-column label="单位" prop="unitOfMeasure" width="100" />
      <el-table-column label="需求数量" prop="quantityIssued" width="120" />
      <el-table-column label="已拣数量" prop="pickedQuantity" width="120">
        <template #default="{ row }">
          <span :class="{ 'text-red-500': row.pickedQuantity < row.quantityIssued }">
            {{ row.pickedQuantity || 0 }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 拣货对话框 -->
    <el-dialog v-model="dialogVisible" title="拣货" width="600px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="物料">
          <el-input :value="currentLine?.itemName" disabled />
        </el-form-item>
        <el-form-item label="需求数量">
          <el-input :value="currentLine?.quantityIssued" disabled />
        </el-form-item>
        <el-form-item label="已拣数量">
          <el-input :value="currentLine?.pickedQuantity || 0" disabled />
        </el-form-item>
        <el-form-item label="库存位置" prop="materialStockId">
          <el-input
            v-model="formData.warehouseName"
            placeholder="请选择库存位置"
            readonly
            @click="handleSelectStock"
            class="cursor-pointer"
          >
            <template #append>
              <el-button @click="handleSelectStock">
                <Icon icon="ep:search" />
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="formData.batchCode" disabled />
        </el-form-item>
        <el-form-item label="库区">
          <el-input v-model="formData.locationName" disabled />
        </el-form-item>
        <el-form-item label="库位">
          <el-input v-model="formData.areaName" disabled />
        </el-form-item>
        <el-form-item label="可用数量">
          <el-input v-model="formData.availableQuantity" disabled />
        </el-form-item>
        <el-form-item label="拣货数量" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :min="0"
            :max="formData.availableQuantity"
            :precision="2"
            class="!w-full"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 库存选择器 -->
    <StockSelect ref="stockSelectRef" @select="handleStockSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import StockSelect from '@/components/MES/StockSelect.vue'

defineOptions({ name: 'ProductionIssueDetail' })

interface DetailItem {
  id?: number
  lineId?: number
  materialStockId: number
  batchId?: number
  batchCode?: string
  warehouseId: number
  warehouseName?: string
  locationId?: number
  locationName?: string
  areaId?: number
  areaName?: string
  quantity: number
}

interface LineItem {
  id?: number
  itemId: number
  itemCode?: string
  itemName?: string
  specification?: string
  unitOfMeasure?: string
  quantityIssued: number
  pickedQuantity?: number
  details?: DetailItem[]
}

const props = defineProps({
  modelValue: {
    type: Array as () => LineItem[],
    default: () => []
  },
  status: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue'])

const lines = ref<LineItem[]>(props.modelValue || [])
const dialogVisible = ref(false)
const currentLine = ref<LineItem | null>(null)
const formRef = ref()
const stockSelectRef = ref()

const canPick = computed(() => props.status === 2) // APPROVING status

const formData = reactive<DetailItem & { availableQuantity?: number }>({
  materialStockId: 0,
  batchCode: '',
  warehouseId: 0,
  warehouseName: '',
  locationId: 0,
  locationName: '',
  areaId: 0,
  areaName: '',
  quantity: 0,
  availableQuantity: 0
})

const formRules = {
  materialStockId: [{ required: true, message: '请选择库存位置', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入拣货数量', trigger: 'blur' }]
}

const handlePick = (row: LineItem) => {
  currentLine.value = row
  resetForm()
  dialogVisible.value = true
}

const handleSelectStock = () => {
  if (!currentLine.value) return
  stockSelectRef.value.open(currentLine.value.itemId)
}

const handleStockSelected = (stock: any) => {
  formData.materialStockId = stock.materialStockId
  formData.batchId = stock.batchId
  formData.batchCode = stock.batchCode
  formData.warehouseId = stock.warehouseId
  formData.warehouseName = stock.warehouseName
  formData.locationId = stock.locationId
  formData.locationName = stock.locationName
  formData.areaId = stock.areaId
  formData.areaName = stock.areaName
  formData.availableQuantity = stock.availableQuantity
}

const handleConfirm = async () => {
  await formRef.value.validate()

  if (!currentLine.value) return

  if (!currentLine.value.details) {
    currentLine.value.details = []
  }

  const detailData: DetailItem = {
    lineId: currentLine.value.id,
    materialStockId: formData.materialStockId,
    batchId: formData.batchId,
    batchCode: formData.batchCode,
    warehouseId: formData.warehouseId,
    warehouseName: formData.warehouseName,
    locationId: formData.locationId,
    locationName: formData.locationName,
    areaId: formData.areaId,
    areaName: formData.areaName,
    quantity: formData.quantity
  }

  currentLine.value.details.push(detailData)

  // 更新已拣数量
  currentLine.value.pickedQuantity = currentLine.value.details.reduce(
    (sum, detail) => sum + detail.quantity,
    0
  )

  emit('update:modelValue', lines.value)
  dialogVisible.value = false
}

const handleDeleteDetail = (row: LineItem, index: number) => {
  if (!row.details) return

  row.details.splice(index, 1)

  // 更新已拣数量
  row.pickedQuantity = row.details.reduce((sum, detail) => sum + detail.quantity, 0)

  emit('update:modelValue', lines.value)
}

const resetForm = () => {
  Object.assign(formData, {
    materialStockId: 0,
    batchCode: '',
    warehouseId: 0,
    warehouseName: '',
    locationId: 0,
    locationName: '',
    areaId: 0,
    areaName: '',
    quantity: 0,
    availableQuantity: 0
  })
  formRef.value?.clearValidate()
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
