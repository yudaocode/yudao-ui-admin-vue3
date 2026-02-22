<!-- TODO @AI：待 review -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="700px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="物料" prop="itemId">
            <el-select
              v-model="formData.itemId"
              placeholder="请选择物料"
              filterable
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="item in itemList"
                :key="item.id"
                :label="`${item.code} - ${item.name}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上架数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <el-select
              v-model="formData.warehouseId"
              placeholder="请选择仓库"
              clearable
              class="!w-1/1"
            >
              <el-option
                v-for="warehouse in warehouseList"
                :key="warehouse.id"
                :label="warehouse.name"
                :value="warehouse.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库区" prop="locationId">
            <el-input v-model="formData.locationId" placeholder="请输入库区ID" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库位" prop="areaId">
            <el-input v-model="formData.areaId" placeholder="请输入库位ID" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
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
</template>

<script setup lang="ts">
import { WmItemReceiptDetailApi, WmItemReceiptDetailVO } from '@/api/mes/wm/itemreceipt/detail'
import { MdItemApi } from '@/api/mes/md/item'
import { WmWarehouseApi } from '@/api/mes/wm/warehouse'

defineOptions({ name: 'ItemReceiptDetailForm' })

const props = defineProps<{ receiptId: number; lineId: number }>()
const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const itemList = ref<any[]>([])
const warehouseList = ref<any[]>([])
const formData = ref({
  id: undefined,
  lineId: undefined as number | undefined,
  receiptId: undefined as number | undefined,
  itemId: undefined,
  quantity: undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  batchId: undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '上架数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  const [items, warehouses] = await Promise.all([
    MdItemApi.getItemSimpleList(),
    WmWarehouseApi.getWarehouseSimpleList()
  ])
  itemList.value = items
  warehouseList.value = warehouses
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmItemReceiptDetailApi.getItemReceiptDetail(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = {
      ...formData.value,
      receiptId: props.receiptId,
      lineId: props.lineId
    } as unknown as WmItemReceiptDetailVO
    if (formType.value === 'create') {
      await WmItemReceiptDetailApi.createItemReceiptDetail(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmItemReceiptDetailApi.updateItemReceiptDetail(data)
      message.success(t('common.updateSuccess'))
    }
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
    lineId: undefined,
    receiptId: undefined,
    itemId: undefined,
    quantity: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    batchId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}
</script>
