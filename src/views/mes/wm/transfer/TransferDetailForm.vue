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
      <el-form-item label="移入仓库" prop="toWarehouseId">
        <WmWarehouseSelect v-model="formData.toWarehouseId" />
      </el-form-item>
      <el-form-item label="移入库区" prop="toLocationId" v-if="formData.toWarehouseId">
        <WmWarehouseLocationSelect
          v-model="formData.toLocationId"
          :warehouse-id="formData.toWarehouseId"
        />
      </el-form-item>
      <el-form-item label="移入库位" prop="toAreaId" v-if="formData.toLocationId">
        <WmWarehouseAreaSelect v-model="formData.toAreaId" :location-id="formData.toLocationId" />
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :precision="2"
          :min="0"
          controls-position="right"
          class="!w-full"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { WmTransferDetailApi, WmTransferDetailVO } from '@/api/mes/wm/transfer/detail'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

// TODO @AI：参考别的 detailform 补全下注释；

defineOptions({ name: 'TransferDetailForm' })

const props = defineProps<{
  transferId: number
}>()

const emit = defineEmits(['success'])
const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const currentLineId = ref<number>()
const formRef = ref()
const formData = ref({
  id: undefined as number | undefined,
  lineId: undefined as number | undefined,
  transferId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  quantity: undefined as number | undefined,
  batchId: undefined as number | undefined,
  toWarehouseId: undefined as number | undefined,
  toLocationId: undefined as number | undefined,
  toAreaId: undefined as number | undefined,
  remark: undefined
})

const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  toWarehouseId: [{ required: true, message: '移入仓库不能为空', trigger: 'change' }],
  toLocationId: [{ required: true, message: '移入库区不能为空', trigger: 'change' }],
  toAreaId: [{ required: true, message: '移入库位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})

const open = async (type: string, lineId: number, itemId?: number, detailId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加调拨明细' : '编辑调拨明细'
  formType.value = type
  currentLineId.value = lineId
  resetForm()
  if (detailId) {
    formLoading.value = true
    try {
      formData.value = await WmTransferDetailApi.getTransferDetail(detailId)
    } finally {
      formLoading.value = false
    }
  } else {
    formData.value.itemId = itemId
  }
}
defineExpose({ open })

const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      transferId: props.transferId,
      lineId: currentLineId.value
    } as unknown as WmTransferDetailVO
    if (formType.value === 'create') {
      await WmTransferDetailApi.createTransferDetail(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmTransferDetailApi.updateTransferDetail(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success', currentLineId.value)
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    lineId: undefined,
    transferId: undefined,
    itemId: undefined,
    quantity: undefined,
    batchId: undefined,
    toWarehouseId: undefined,
    toLocationId: undefined,
    toAreaId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
