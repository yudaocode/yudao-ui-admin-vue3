<!-- MES 盘点任务结果列表子组件 -->
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
      <Icon icon="ep:plus" class="mr-5px" /> 新增
    </el-button>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true" border>
      <el-table-column label="产品物料编码" align="center" prop="itemCode" min-width="140" />
      <el-table-column label="产品物料名称" align="center" prop="itemName" min-width="160" />
      <el-table-column label="规格型号" align="center" prop="specification" min-width="120" />
      <el-table-column label="单位名称" align="center" prop="unitMeasureName" width="90" />
      <!-- TODO @AI：三个仓库字段 -->
      <el-table-column label="数量" align="center" prop="quantity" min-width="120" />
      <el-table-column label="盘点数量" align="center" prop="takingQuantity" min-width="120" />
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

  <!-- 添加/编辑弹窗 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="960px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <!-- 执行盘点模式：选择盘点清单行 -->
      <!--
       TODO @AI：我想是这样的：
       lineId 是可选的；
       1）选择了 lineId 的情况下，其他字段（itemId、warehouseId 等）都不可修改，且根据 lineId 自动带出对应的值；
        2）不选择 lineId 的情况下，其他字段都可以手动选择/
       -->
      <el-row v-if="isExecuteMode && dialogFormType === 'create'">
        <el-col :span="24">
          <el-form-item label="盘点清单" prop="lineId">
            <el-select
              v-model="formData.lineId"
              placeholder="请选择盘点清单"
              class="!w-full"
              @change="handleLineChange"
            >
              <el-option
                v-for="line in taskLineList"
                :key="line.id"
                :label="`${line.itemCode} - ${line.itemName} (${line.warehouseName}${line.locationName ? ' / ' + line.locationName : ''}${line.areaName ? ' / ' + line.areaName : ''})`"
                :value="line.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <!-- 普通模式：手动选择物料和仓库 -->
      <el-row v-if="!isExecuteMode || dialogFormType === 'update'">
        <el-col :span="8">
          <el-form-item label="物料" prop="itemId">
            <MdItemSelect v-model="formData.itemId" placeholder="请选择物料" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="批次编码" prop="batchCode">
            <el-input v-model="formData.batchCode" placeholder="请输入批次编码" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="仓库" prop="warehouseId">
            <WmWarehouseSelect
              v-model="formData.warehouseId"
              placeholder="请选择仓库"
              @change="handleWarehouseChange"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="!isExecuteMode || dialogFormType === 'update'">
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

      <!-- 差异数量 -->
      <el-row>
        <el-col :span="8">
          <el-form-item label="差异数量" prop="quantity">
            <el-input-number
              v-model="formData.quantity"
              :precision="2"
              controls-position="right"
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
import {
  StockTakingResultApi,
  type StockTakingResultVO
} from '@/api/mes/wm/stocktaking/task/result/index'
import {
  StockTakingTaskLineApi,
  type StockTakingTaskLineVO
} from '@/api/mes/wm/stocktaking/task/line/index'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'

defineOptions({ name: 'StockTakingTaskResultList' })

const props = defineProps<{
  taskId: number
  formType?: string
}>()

const { t } = useI18n()
const message = useMessage()

const isReadOnly = computed(() => props.formType === 'detail')
const isExecuteMode = computed(() => props.formType === 'execute')

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<StockTakingResultVO[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined as number | undefined
})

/** 查询列表 */
const getList = async () => {
  if (!props.taskId) return
  loading.value = true
  try {
    queryParams.taskId = props.taskId
    const data = await StockTakingResultApi.getStockTakingResultList(queryParams)
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
    await StockTakingResultApi.deleteStockTakingResult(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const dialogFormType = ref('')
const taskLineList = ref<StockTakingTaskLineVO[]>([])
const formData = ref({
  id: undefined,
  taskId: undefined as number | undefined,
  lineId: undefined,
  materialStockId: undefined,
  itemId: undefined,
  batchId: undefined,
  batchCode: undefined,
  warehouseId: undefined,
  locationId: undefined,
  areaId: undefined,
  quantity: undefined,
  remark: undefined
})
const formRules = reactive({
  lineId: [{ required: true, message: '请选择盘点清单', trigger: 'change' }],
  quantity: [{ required: true, message: '差异数量不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  dialogFormType.value = type
  resetForm()

  // 执行盘点模式下，加载盘点清单列表
  if (isExecuteMode.value && !id) {
    formLoading.value = true
    try {
      taskLineList.value = await StockTakingTaskLineApi.getStockTakingTaskLineSimpleList(
        props.taskId
      )
    } finally {
      formLoading.value = false
    }
  }

  if (id) {
    formLoading.value = true
    try {
      formData.value = await StockTakingResultApi.getStockTakingResult(id)
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
    } as unknown as StockTakingResultVO
    if (dialogFormType.value === 'create') {
      await StockTakingResultApi.createStockTakingResult(data)
      message.success(t('common.createSuccess'))
    } else {
      await StockTakingResultApi.updateStockTakingResult(data)
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

/** 盘点清单行变化 */
const handleLineChange = (lineId: number) => {
  const line = taskLineList.value.find((item) => item.id === lineId)
  if (line) {
    // TODO @AI：linter 报错；
    formData.value.materialStockId = line.materialStockId
    formData.value.itemId = line.itemId
    formData.value.batchId = line.batchId
    formData.value.batchCode = line.batchCode
    formData.value.warehouseId = line.warehouseId
    formData.value.locationId = line.locationId
    formData.value.areaId = line.areaId
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    taskId: undefined,
    lineId: undefined,
    materialStockId: undefined,
    itemId: undefined,
    batchId: undefined,
    batchCode: undefined,
    warehouseId: undefined,
    locationId: undefined,
    areaId: undefined,
    quantity: undefined,
    remark: undefined
  }
  formRef.value?.resetFields()
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
