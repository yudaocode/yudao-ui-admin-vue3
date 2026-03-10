<!-- MES 盘点任务行列表子组件 -->
<template>
  <div>
    <el-button
      v-if="!isReadOnly"
      v-hasPermi="['mes:wm-stock-taking-task:update']"
      type="primary"
      plain
      @click="openForm('create')"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加物料
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="物料编码" align="center" prop="itemCode" min-width="140" />
      <el-table-column label="物料名称" align="center" prop="itemName" min-width="160" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位" align="center" prop="unitMeasureName" width="90" />
      <el-table-column label="在库数量" align="center" prop="quantity" width="120" />
      <el-table-column label="仓库" align="center" prop="warehouseName" min-width="120" />
      <el-table-column label="库区" align="center" prop="locationName" min-width="120" />
      <el-table-column label="库位" align="center" prop="areaName" min-width="120" />
      <el-table-column label="状态" align="center" min-width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_LINE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column v-if="!isReadOnly" label="操作" align="center" width="160" fixed="right">
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

  <!-- 添加/编辑行弹窗 -->
  <!-- TODO @芋艿：后续要改成 stockSelect 批量选择后，进行处理； -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="700px">
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
            <MdItemSelect v-model="formData.itemId" placeholder="请选择物料" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="在库数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              :min="0"
              controls-position="right"
              class="!w-1/1"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" placeholder="请选择状态">
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_LINE_STATUS)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WmWarehouseSelect
              v-model="formData.warehouseId"
              placeholder="请选择仓库"
              @change="handleWarehouseChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.warehouseId">
          <el-form-item label="库区" prop="locationId">
            <WmWarehouseLocationSelect
              v-model="formData.locationId"
              :warehouse-id="formData.warehouseId"
              placeholder="请选择库区"
              @change="handleLocationChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8" v-if="formData.locationId">
          <el-form-item label="库位" prop="areaId">
            <WmWarehouseAreaSelect
              v-model="formData.areaId"
              :location-id="formData.locationId"
              placeholder="请选择库位"
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

const { t } = useI18n()
const message = useMessage()

const isReadOnly = computed(() => props.formType === 'detail')

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<StockTakingTaskLineVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined as number | undefined
})

/** 查询行列表 */
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

/** 删除 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await StockTakingTaskLineApi.deleteStockTakingTaskLine(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const dialogFormType = ref('')
const formData = ref({
  id: undefined,
  taskId: undefined as number | undefined,
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
  locationId: [{ required: true, message: '库区不能为空', trigger: 'change' }],
  areaId: [{ required: true, message: '库位不能为空', trigger: 'change' }],
  quantity: [{ required: true, message: '在库数量不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  dialogFormType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await StockTakingTaskLineApi.getStockTakingTaskLine(id)
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
      taskId: props.taskId
    } as unknown as StockTakingTaskLineVO
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

/** 仓库变化时清空库区和库位 */
const handleWarehouseChange = () => {
  formData.value.locationId = undefined
  formData.value.areaId = undefined
}

/** 库区变化时清空库位 */
const handleLocationChange = () => {
  formData.value.areaId = undefined
}

/** 重置表单 */
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

/** 监听 taskId 变化 */
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
