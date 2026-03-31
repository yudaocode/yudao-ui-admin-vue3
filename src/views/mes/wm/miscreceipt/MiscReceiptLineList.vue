<!-- MES 杂项入库单行列表子组件 -->
<template>
  <div>
    <el-button v-if="isEditable" type="primary" plain @click="openForm('create')" class="mb-10px">
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="入库数量" align="center" prop="quantity" width="100" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column label="仓库" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位" align="center" prop="areaName" min-width="100" />
      <el-table-column v-if="isEditable" label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>

  <!-- 添加/编辑行弹窗 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
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
            <MdItemSelect v-model="formData.itemId" placeholder="请选择物料" class="!w-1/1" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="入库数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0.01"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号" prop="batchCode">
            <el-input v-model="formData.batchCode" placeholder="请输入批次号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WmWarehouseSelect
              v-model="formData.warehouseId"
              placeholder="请选择仓库"
              class="!w-1/1"
              @change="handleWarehouseChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库区" prop="locationId">
            <WmWarehouseLocationSelect
              v-model="formData.locationId"
              :warehouse-id="formData.warehouseId"
              placeholder="请选择库区"
              class="!w-1/1"
              @change="handleLocationChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库位" prop="areaId">
            <WmWarehouseAreaSelect
              v-model="formData.areaId"
              :location-id="formData.locationId"
              placeholder="请选择库位"
              class="!w-1/1"
            />
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
import { WmMiscReceiptLineApi, WmMiscReceiptLineVO } from '@/api/mes/wm/miscreceipt/line'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'MiscReceiptLineList' })

const props = defineProps<{
  receiptId: number
  formType: string
}>()

const message = useMessage()

const isEditable = computed(() => ['create', 'update'].includes(props.formType))

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<WmMiscReceiptLineVO[]>([])

/** 查询行列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await WmMiscReceiptLineApi.getMiscReceiptLineListByReceiptId(props.receiptId)
  } finally {
    loading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmMiscReceiptLineApi.deleteMiscReceiptLine(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const formLoading = ref(false)
const lineFormType = ref<string>('create')
const dialogTitle = computed(() => {
  return lineFormType.value === 'create' ? '添加物料' : '编辑物料'
})
const formData = ref({
  id: undefined as number | undefined,
  receiptId: props.receiptId,
  itemId: undefined,
  quantity: undefined,
  batchCode: undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  remark: undefined
})
const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  quantity: [
    { required: true, message: '入库数量不能为空', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '入库数量必须大于 0', trigger: 'blur' }
  ],
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 仓库变化时，清空库区和库位 */
const handleWarehouseChange = () => {
  formData.value.locationId = undefined
  formData.value.areaId = undefined
}

/** 库区变化时，清空库位 */
const handleLocationChange = () => {
  formData.value.areaId = undefined
}

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmMiscReceiptLineApi.getMiscReceiptLine(id)
    } finally {
      formLoading.value = false
    }
  }
}

/** 提交表单 */
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = formData.value as unknown as WmMiscReceiptLineVO
    if (lineFormType.value === 'create') {
      await WmMiscReceiptLineApi.createMiscReceiptLine(data)
      message.success('新增成功')
    } else {
      await WmMiscReceiptLineApi.updateMiscReceiptLine(data)
      message.success('修改成功')
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    receiptId: props.receiptId,
    itemId: undefined,
    quantity: undefined,
    batchCode: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(() => {
  getList()
})

watch(
  () => props.receiptId,
  () => {
    if (props.receiptId) {
      getList()
    }
  }
)
</script>
