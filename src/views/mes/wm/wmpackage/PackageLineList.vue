<!-- MES 装箱明细列表子组件 -->
<template>
  <div>
    <el-button
      v-if="isEditable"
      type="primary"
      plain
      @click="openForm('create')"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加明细
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="产品物料编码" align="center" prop="itemCode" min-width="120" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="140" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="80" />
      <el-table-column label="装箱数量" align="center" prop="quantity" width="100" />
      <el-table-column label="生产工单编号" align="center" prop="workOrderCode" min-width="140" />
      <el-table-column label="批次号" align="center" prop="batchCode" min-width="120" />
      <el-table-column
        label="有效期"
        align="center"
        prop="expireDate"
        :formatter="dateFormatter2"
        width="120"
      />
      <el-table-column label="仓库" align="center" prop="warehouseName" min-width="100" />
      <el-table-column label="库区" align="center" prop="locationName" min-width="100" />
      <el-table-column label="库位" align="center" prop="areaName" min-width="100" />
      <el-table-column v-if="isEditable" label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>

  <!-- 添加/编辑明细弹窗 -->
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
          <el-form-item label="生产工单" prop="workOrderId">
            <ProWorkOrderSelect
              v-model="formData.workOrderId"
              @change="handleWorkOrderChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次号" prop="batchCode">
            <el-input v-model="formData.batchCode" disabled placeholder="自动填充" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="装箱数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0.01"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="产品物料编码">
            <el-input v-model="formData.itemCode" disabled placeholder="自动填充" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="产品物料名称">
            <el-input v-model="formData.itemName" disabled placeholder="自动填充" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单位">
            <el-input v-model="formData.unitMeasureName" disabled placeholder="自动填充" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="规格型号">
            <el-input
              v-model="formData.specification"
              type="textarea"
              disabled
              placeholder="自动填充"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WmWarehouseSelect
              v-model="formData.warehouseId"
              @change="handleWarehouseChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库区" prop="locationId">
            <WmWarehouseLocationSelect
              v-model="formData.locationId"
              :warehouse-id="formData.warehouseId"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="库位" prop="areaId">
            <WmWarehouseAreaSelect
              v-model="formData.areaId"
              :warehouse-id="formData.warehouseId"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="有效期" prop="expireDate">
            <el-date-picker
              v-model="formData.expireDate"
              type="date"
              value-format="x"
              placeholder="请选择有效期"
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
import { dateFormatter2 } from '@/utils/formatTime'
import {
  WmPackageLineApi,
  WmPackageLineRespVO,
  WmPackageLineSaveReqVO
} from '@/api/mes/wm/wmpackage'
import ProWorkOrderSelect from '@/views/mes/pro/workorder/components/ProWorkOrderSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'PackageLineList' })

const props = defineProps<{
  packageId: number
  formType: string
}>()

const { t } = useI18n()
const message = useMessage()

const isEditable = computed(() => ['create', 'update'].includes(props.formType))

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<WmPackageLineRespVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  packageId: undefined as number | undefined
})

/** 查询明细列表 */
const getList = async () => {
  loading.value = true
  try {
    queryParams.packageId = props.packageId
    const data = await WmPackageLineApi.getPackageLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await WmPackageLineApi.deletePackageLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const lineFormType = ref('')
const formData = ref({
  id: undefined as number | undefined,
  packageId: undefined as number | undefined,
  materialStockId: undefined as number | undefined,
  itemId: undefined as number | undefined,
  itemCode: undefined as string | undefined,
  itemName: undefined as string | undefined,
  specification: undefined as string | undefined,
  unitMeasureName: undefined as string | undefined,
  quantity: undefined as number | undefined,
  workOrderId: undefined as number | undefined,
  batchCode: undefined as string | undefined,
  warehouseId: undefined as number | undefined,
  locationId: undefined as number | undefined,
  areaId: undefined as number | undefined,
  expireDate: undefined as number | undefined,
  remark: undefined as string | undefined
})
const formRules = reactive({
  workOrderId: [{ required: true, message: '请选择生产工单', trigger: 'change' }],
  quantity: [
    { required: true, message: '装箱数量不能为空', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '装箱数量必须大于0', trigger: 'blur' }
  ]
})
const formRef = ref()

/** 生产工单变化时，自动填充产品信息 */
const handleWorkOrderChange = (workOrder: any) => {
  if (workOrder) {
    formData.value.itemId = workOrder.itemId
    formData.value.itemCode = workOrder.itemCode
    formData.value.itemName = workOrder.itemName
    formData.value.specification = workOrder.specification
    formData.value.unitMeasureName = workOrder.unitName
    formData.value.batchCode = workOrder.batchCode
  } else {
    formData.value.itemId = undefined
    formData.value.itemCode = undefined
    formData.value.itemName = undefined
    formData.value.specification = undefined
    formData.value.unitMeasureName = undefined
    formData.value.batchCode = undefined
  }
}

/** 仓库变化时，清空库区库位 */
const handleWarehouseChange = () => {
  // WmWarehouseLocationSelect 和 WmWarehouseAreaSelect 内部会自动 watch warehouseId 并清空
}

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '添加装箱明细' : '修改装箱明细'
  lineFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await WmPackageLineApi.getPackageLine(id)
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
    const data = {
      ...formData.value,
      packageId: props.packageId
    } as unknown as WmPackageLineSaveReqVO
    if (lineFormType.value === 'create') {
      await WmPackageLineApi.createPackageLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await WmPackageLineApi.updatePackageLine(data)
      message.success(t('common.updateSuccess'))
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
    packageId: undefined,
    materialStockId: undefined,
    itemId: undefined,
    itemCode: undefined,
    itemName: undefined,
    specification: undefined,
    unitMeasureName: undefined,
    quantity: undefined,
    workOrderId: undefined,
    batchCode: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    expireDate: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 初始化 */
onMounted(async () => {
  await getList()
})
</script>
