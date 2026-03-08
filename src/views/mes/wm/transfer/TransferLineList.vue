<template>
  <div>
    <el-button v-if="isUpdate" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加调拨物料
    </el-button>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      border
      :row-key="(row: any) => row.id"
    >
      <el-table-column type="expand">
        <template #default="scope">
          <TransferDetailList
            :ref="(el: any) => setDetailListRef(scope.row.id, el)"
            :transfer-id="props.transferId"
            :line-id="scope.row.id"
            :item-id="scope.row.itemId"
            :line-quantity="scope.row.quantity"
            :form-type="props.formType"
            @edit-detail="
              (detailId: number) =>
                openDetailForm('update', scope.row.id, scope.row.itemId, detailId)
            "
          />
        </template>
      </el-table-column>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="转移数量" align="center" prop="quantity" width="100" />
      <!-- TODO @AI：不需要“已分配字段”、“剩余”字段 -->
      <el-table-column v-if="isStock" label="已分配" align="center" min-width="100">
        <template #default="scope">
          {{ allocatedQuantityMap[scope.row.id] || 0 }}
        </template>
      </el-table-column>
      <el-table-column v-if="isStock" label="剩余" align="center" min-width="100">
        <template #default="scope">
          {{ Number(scope.row.quantity || 0) - Number(allocatedQuantityMap[scope.row.id] || 0) }}
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="移出仓库" align="center" prop="fromWarehouseName" min-width="120" />
      <el-table-column label="移出库区" align="center" prop="fromLocationName" min-width="120" />
      <el-table-column label="移出库位" align="center" prop="fromAreaName" min-width="120" />
      <el-table-column
        v-if="isUpdate || isStock"
        label="操作"
        align="center"
        width="180"
        fixed="right"
      >
        <template #default="scope">
          <el-button v-if="isUpdate" link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button v-if="isUpdate" link type="danger" @click="handleDelete(scope.row.id)">
            删除
          </el-button>
          <!-- TODO @AI：添加明细，应该是“上架” -->
          <el-button v-if="isStock" link type="success" @click="handleStock(scope.row.id)">
            添加明细
          </el-button>
          <!-- TODO @芋艿：【标签打印】 -->
        </template>
      </el-table-column>
    </el-table>
  </div>

  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1080px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="8">
          <el-form-item label="来源库存" prop="materialStockId">
            <!-- TODO @AI：这里先去掉，只用下面的 MdItemSelect；不要 disabled； -->
            <el-input :model-value="materialStockDisplay" readonly placeholder="请选择来源库存">
              <template #append>
                <el-button @click="openMaterialStockSelect">选择</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="物料" prop="itemId">
            <MdItemSelect v-model="formData.itemId" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="转移数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0"
              :max="selectedStockQuantity || undefined"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号">
            <el-input v-model="formData.batchCode" disabled />
          </el-form-item>
        </el-col>
        <!-- TODO @AI：这里先对应的选择器；后续切换库存选择器后，这里在 disabled 掉； -->
        <el-col :span="8">
          <el-form-item label="移出仓库">
            <el-input v-model="formData.fromWarehouseName" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="移出库区">
            <el-input v-model="formData.fromLocationName" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="移出库位">
            <el-input v-model="formData.fromAreaName" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>

  <WmMaterialStockSelect ref="materialStockSelectRef" @select="handleMaterialStockSelect" />
  <TransferDetailForm
    ref="detailFormRef"
    :transfer-id="props.transferId"
    @success="onDetailFormSuccess"
  />
</template>

<script setup lang="ts">
import { WmTransferLineApi, WmTransferLineVO } from '@/api/mes/wm/transfer/line'
import { WmTransferDetailApi } from '@/api/mes/wm/transfer/detail'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmMaterialStockSelect from '@/views/mes/wm/materialstock/components/WmMaterialStockSelect.vue'
import TransferDetailList from './TransferDetailList.vue'
import TransferDetailForm from './TransferDetailForm.vue'

// TODO @AI：下面的代码先简化下，目前太复杂了；看看别的 linelist 组件；

defineOptions({ name: 'TransferLineList' })

const props = defineProps<{
  transferId: number
  formType: string
}>()

const { t } = useI18n()
const message = useMessage()

const isUpdate = computed(() => ['create', 'update'].includes(props.formType))
const isStock = computed(() => props.formType === 'stock')

const loading = ref(false)
const list = ref<WmTransferLineVO[]>([])
const materialStockSelectRef = ref()
const detailFormRef = ref()
const detailListRefs = ref<Record<number, InstanceType<typeof TransferDetailList>>>({})
const allocatedQuantityMap = ref<Record<number, number>>({})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const lineFormType = ref('')
const formRef = ref()
const selectedStockQuantity = ref<number | undefined>(undefined)
const formData = ref({
  id: undefined as number | undefined,
  transferId: undefined as number | undefined,
  materialStockId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  itemCode: undefined,
  itemName: undefined,
  specification: undefined,
  unitMeasureName: undefined,
  quantity: undefined as number | undefined,
  batchId: undefined as number | undefined,
  batchCode: undefined,
  fromWarehouseId: undefined as number | undefined,
  fromWarehouseName: undefined,
  fromLocationId: undefined as number | undefined,
  fromLocationName: undefined,
  fromAreaId: undefined as number | undefined,
  fromAreaName: undefined,
  remark: undefined
})

const materialStockDisplay = computed(() => {
  if (!formData.value.materialStockId) {
    return ''
  }
  return [formData.value.itemCode, formData.value.itemName, formData.value.batchCode]
    .filter(Boolean)
    .join(' / ')
})

const formRules = reactive({
  materialStockId: [{ required: true, message: '来源库存不能为空', trigger: 'change' }],
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '转移数量不能为空', trigger: 'blur' }]
})

const getList = async () => {
  loading.value = true
  try {
    list.value = await WmTransferLineApi.getTransferLineList(props.transferId)
  } finally {
    loading.value = false
  }
}

const refreshAllDetailAllocated = async () => {
  if (!list.value.length) {
    allocatedQuantityMap.value = {}
    return
  }
  const entries = await Promise.all(
    list.value.map(async (row) => {
      const details = await WmTransferDetailApi.getTransferDetailListByLineId(row.id)
      const total = details.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      return [row.id, total] as const
    })
  )
  allocatedQuantityMap.value = Object.fromEntries(entries)
}

defineExpose({ getList })

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmTransferLineApi.deleteTransferLine(id)
    message.success(t('common.delSuccess'))
    await getList()
    await refreshAllDetailAllocated()
  } catch {}
}

const openMaterialStockSelect = () => {
  materialStockSelectRef.value.open(formData.value.itemId)
}

const handleMaterialStockSelect = (row: any) => {
  selectedStockQuantity.value = row.availableQuantity
  formData.value.materialStockId = row.materialStockId
  formData.value.itemId = row.itemId
  formData.value.itemCode = row.itemCode
  formData.value.itemName = row.itemName
  formData.value.specification = row.specification
  formData.value.unitMeasureName = row.unitMeasureName
  formData.value.batchId = row.batchId
  formData.value.batchCode = row.batchCode
  formData.value.fromWarehouseId = row.warehouseId
  formData.value.fromWarehouseName = row.warehouseName
  formData.value.fromLocationId = row.locationId
  formData.value.fromLocationName = row.locationName
  formData.value.fromAreaId = row.areaId
  formData.value.fromAreaName = row.areaName
}

const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加调拨物料' : '编辑调拨物料'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmTransferLineApi.getTransferLine(id)
      const currentLine = list.value.find((item) => item.id === id)
      selectedStockQuantity.value = Number(currentLine?.quantity || 0)
    } finally {
      formLoading.value = false
    }
  }
}

const submitForm = async () => {
  await formRef.value.validate()
  if (
    selectedStockQuantity.value !== undefined &&
    Number(formData.value.quantity) > selectedStockQuantity.value
  ) {
    message.warning('转移数量不能超过可用数量')
    return
  }
  formLoading.value = true
  try {
    const data = { ...formData.value, transferId: props.transferId } as unknown as WmTransferLineVO
    if (lineFormType.value === 'create') {
      await WmTransferLineApi.createTransferLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmTransferLineApi.updateTransferLine(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
    await refreshAllDetailAllocated()
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  selectedStockQuantity.value = undefined
  formData.value = {
    id: undefined,
    transferId: undefined,
    materialStockId: undefined,
    itemId: undefined,
    itemCode: undefined,
    itemName: undefined,
    specification: undefined,
    unitMeasureName: undefined,
    quantity: undefined,
    batchId: undefined,
    batchCode: undefined,
    fromWarehouseId: undefined,
    fromWarehouseName: undefined,
    fromLocationId: undefined,
    fromLocationName: undefined,
    fromAreaId: undefined,
    fromAreaName: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

const setDetailListRef = (lineId: number, el: any) => {
  if (el) {
    detailListRefs.value[lineId] = el
  }
}

const handleStock = (lineId: number) => {
  const row = list.value.find((r) => r.id === lineId)
  openDetailForm('create', lineId, row?.itemId)
}

const openDetailForm = (type: string, lineId: number, itemId?: number, detailId?: number) => {
  detailFormRef.value.open(type, lineId, itemId, detailId)
}

const onDetailFormSuccess = async (lineId: number) => {
  await detailListRefs.value[lineId]?.getList()
  await refreshAllDetailAllocated()
}

onMounted(async () => {
  await getList()
  await refreshAllDetailAllocated()
})
</script>
