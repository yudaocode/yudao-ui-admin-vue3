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
          <!-- DONE @AI：按钮文案改为“上架”，更贴合当前业务语义 -->
          <el-button v-if="isStock" link type="success" @click="handleStock(scope.row.id)">
            上架
          </el-button>
          <!-- DONE @芋艿：【标签打印】（AI 未修复原因：标注为人工后续处理） -->
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
          <el-form-item label="物料" prop="itemId">
            <!-- DONE @AI：已移除来源库存选择逻辑，改为直接选择物料 -->
            <MdItemSelect v-model="formData.itemId" placeholder="请选择物料" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="转移数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-full"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号">
            <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
          </el-form-item>
        </el-col>
        <!-- DONE @AI：移出仓库/库区/库位改为可编辑选择，符合当前录入要求 -->
        <el-col :span="8">
          <el-form-item label="移出仓库" prop="fromWarehouseId">
            <WmWarehouseSelect v-model="formData.fromWarehouseId" @change="handleWarehouseChange" />
          </el-form-item>
        </el-col>
        <el-col v-if="formData.fromWarehouseId" :span="8">
          <el-form-item label="移出库区" prop="fromLocationId">
            <WmWarehouseLocationSelect
              v-model="formData.fromLocationId"
              :warehouse-id="formData.fromWarehouseId"
              @change="handleLocationChange"
            />
          </el-form-item>
        </el-col>
        <el-col v-if="formData.fromLocationId" :span="8">
          <el-form-item label="移出库位" prop="fromAreaId">
            <WmWarehouseAreaSelect
              v-model="formData.fromAreaId"
              :location-id="formData.fromLocationId"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
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
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'
import TransferDetailList from './TransferDetailList.vue'
import TransferDetailForm from './TransferDetailForm.vue'

// DONE @AI：当前保留展开明细与分配刷新逻辑，避免影响上架场景交互

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
const detailFormRef = ref()
const detailListRefs = ref<Record<number, InstanceType<typeof TransferDetailList>>>({})
const allocatedQuantityMap = ref<Record<number, number>>({})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const lineFormType = ref('')
const formRef = ref()
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

const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '转移数量不能为空', trigger: 'blur' }],
  fromWarehouseId: [{ required: true, message: '移出仓库不能为空', trigger: 'change' }],
  fromLocationId: [{ required: true, message: '移出库区不能为空', trigger: 'change' }],
  fromAreaId: [{ required: true, message: '移出库位不能为空', trigger: 'change' }]
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

const handleWarehouseChange = () => {
  formData.value.fromLocationId = undefined
  formData.value.fromLocationName = undefined
  formData.value.fromAreaId = undefined
  formData.value.fromAreaName = undefined
}

const handleLocationChange = () => {
  formData.value.fromAreaId = undefined
  formData.value.fromAreaName = undefined
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
    } finally {
      formLoading.value = false
    }
  }
}

const submitForm = async () => {
  await formRef.value.validate()
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
