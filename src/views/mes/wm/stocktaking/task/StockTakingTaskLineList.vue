<!-- MES 盘点任务行列表子组件 -->
<template>
  <div>
    <el-button
      v-if="!isReadOnly"
      v-hasPermi="['mes:wm-stock-taking-task:update']"
      type="primary"
      plain
      @click="handleAdd"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      border
    >
      <el-table-column label="物料编码" prop="itemCode" min-width="140" />
      <el-table-column label="物料名称" prop="itemName" min-width="160" />
      <el-table-column label="规格型号" prop="specification" min-width="120" />
      <el-table-column label="单位" prop="unitMeasureName" width="90" />
      <el-table-column label="在库数量" prop="quantity" width="120" />
      <el-table-column label="仓库" prop="warehouseName" min-width="120" />
      <el-table-column label="库区" prop="locationName" min-width="120" />
      <el-table-column label="库位" prop="areaName" min-width="120" />
      <el-table-column label="状态" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_LINE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column v-if="!isReadOnly" label="操作" width="160" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleEdit(scope.row)"
            v-hasPermi="['mes:wm-stock-taking-task:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['mes:wm-stock-taking-task:update']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <Dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        v-loading="formLoading"
      >
        <el-form-item label="物料" prop="itemId">
          <MdItemSelect v-model="formData.itemId" placeholder="请选择物料" class="!w-full" />
        </el-form-item>
        <el-form-item label="仓库" prop="warehouseId">
          <WmWarehouseSelect v-model="formData.warehouseId" placeholder="请选择仓库" class="!w-full" />
        </el-form-item>
        <el-form-item label="库区" prop="locationId">
          <WmWarehouseLocationSelect
            v-model="formData.locationId"
            :warehouse-id="formData.warehouseId"
            placeholder="请选择库区"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="库位" prop="areaId">
          <WmWarehouseAreaSelect
            v-model="formData.areaId"
            :location-id="formData.locationId"
            placeholder="请选择库位"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="在库数量" prop="quantity">
          <el-input-number
            v-model="formData.quantity"
            :precision="2"
            :min="0"
            controls-position="right"
            class="!w-full"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" class="!w-full">
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_LINE_STATUS)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
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
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import {
  StockTakingTaskLineApi,
  type StockTakingTaskLineVO
} from '@/api/mes/wm/stocktaking/task/line/index'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'StockTakingTaskLineList' })

const props = defineProps<{
  taskId: number
  formType?: string
}>()

const message = useMessage()
const { t } = useI18n()

const isReadOnly = computed(() => props.formType === 'detail')
const loading = ref(false)
const list = ref<StockTakingTaskLineVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined as number | undefined
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const dialogFormType = ref('')
const formRef = ref()

const formData = ref({
  id: undefined,
  taskId: undefined,
  itemId: undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  quantity: undefined,
  status: undefined,
  remark: undefined
})

const formRules = reactive({
  itemId: [{ required: true, message: '物料不能为空', trigger: 'change' }],
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '在库数量不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

const getList = async () => {
  if (!props.taskId) return
  loading.value = true
  try {
    queryParams.taskId = props.taskId
    const data = await StockTakingTaskLineApi.getStockTakingTaskLinePage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogVisible.value = true
  dialogTitle.value = '添加盘点任务行'
  dialogFormType.value = 'create'
  resetForm()
}

const handleEdit = async (row: StockTakingTaskLineVO) => {
  dialogVisible.value = true
  dialogTitle.value = '编辑盘点任务行'
  dialogFormType.value = 'update'
  formData.value = { ...row }
}

const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    const data = { ...formData.value, taskId: props.taskId }
    if (dialogFormType.value === 'create') {
      await StockTakingTaskLineApi.createStockTakingTaskLine(data)
      message.success(t('common.createSuccess'))
    } else {
      await StockTakingTaskLineApi.updateStockTakingTaskLine(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    taskId: undefined,
    itemId: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    quantity: undefined,
    status: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await StockTakingTaskLineApi.deleteStockTakingTaskLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

watch(
  () => props.taskId,
  () => {
    queryParams.pageNo = 1
    getList()
  },
  { immediate: true }
)

defineExpose({ getList })
</script>
