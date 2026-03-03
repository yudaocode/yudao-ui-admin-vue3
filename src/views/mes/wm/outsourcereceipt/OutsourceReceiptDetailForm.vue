<!-- MES 委外收货明细表单弹窗 -->
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
      <el-form-item label="批次号" prop="batchCode">
        <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
      </el-form-item>
      <!-- TODO @AI：参考别的 detail form；应该有 3 个 select； -->
      <el-form-item label="库位" prop="locationId">
        <MdLocationSelect v-model="formData.locationId" />
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :precision="2"
          :min="0"
          controls-position="right"
          class="!w-1/1"
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
import { WmOutsourceReceiptDetailApi, WmOutsourceReceiptDetailVO } from '@/api/mes/wm/outsourcereceipt/detail'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import MdLocationSelect from '@/views/mes/md/location/components/MdLocationSelect.vue'

defineOptions({ name: 'OutsourceReceiptDetailForm' })

const props = defineProps<{
  receiptId: number
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
  receiptId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  batchCode: undefined,
  quantity: undefined as number | undefined,
  locationId: undefined as number | undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  batchCode: [{ required: true, message: '批次号不能为空', trigger: 'blur' }],
  locationId: [{ required: true, message: '库位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }]
})

/** 打开弹窗 */
const open = async (type: string, lineId: number, itemId?: number, detailId?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加收货明细' : '编辑收货明细'
  formType.value = type
  currentLineId.value = lineId
  resetForm()
  if (detailId) {
    formLoading.value = true
    try {
      formData.value = await WmOutsourceReceiptDetailApi.getOutsourceReceiptDetail(detailId)
    } finally {
      formLoading.value = false
    }
  } else if (itemId) {
    formData.value.itemId = itemId
  }
}
defineExpose({ open })

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      receiptId: props.receiptId,
      lineId: currentLineId.value
    } as unknown as WmOutsourceReceiptDetailVO
    if (formType.value === 'create') {
      await WmOutsourceReceiptDetailApi.createOutsourceReceiptDetail(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmOutsourceReceiptDetailApi.updateOutsourceReceiptDetail(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
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
    receiptId: undefined,
    itemId: undefined,
    batchCode: undefined,
    quantity: undefined,
    locationId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
