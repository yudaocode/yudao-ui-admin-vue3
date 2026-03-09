<!-- MES 盘点方案条件列表子组件 -->
<template>
  <div>
    <el-button
      type="primary"
      plain
      @click="openForm('create')"
      :disabled="disabled || (isRemoteMode && !planId)"
      class="mb-10px"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 添加条件
    </el-button>
    <el-table
      v-loading="loading"
      :data="displayList"
      :stripe="true"
      :show-overflow-tooltip="true"
      border
    >
      <el-table-column label="条件类型" align="center" min-width="120">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE" :value="scope.row.type" />
        </template>
      </el-table-column>
      <el-table-column label="条件值编码" align="center" prop="valueCode" min-width="140" />
      <el-table-column label="条件值名称" align="center" prop="valueName" min-width="160" />
      <el-table-column v-if="!disabled" label="操作" align="center" width="120">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-if="isRemoteMode"
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </div>

  <!-- 添加/编辑条件弹窗 -->
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="900px">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-row>
        <el-col :span="12">
          <el-form-item label="条件类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择条件类型"
              class="!w-full"
              @change="handleTypeChange"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_PLAN_PARAM_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="条件值" prop="valueId">
            <template v-if="formData.type === BarcodeBizTypeEnum.WAREHOUSE">
              <WmWarehouseSelect
                v-model="formData.valueId"
                @change="(item) => handleSelectorChange(item)"
              />
            </template>
            <template v-else-if="formData.type === BarcodeBizTypeEnum.LOCATION">
              <div class="space-y-2">
                <WmWarehouseSelect
                  v-model="locationWarehouseId"
                  @change="handleLocationWarehouseChange"
                  class="!w-1/1"
                  placeholder="请选择仓库"
                />
                <WmWarehouseLocationSelect
                  v-model="formData.valueId"
                  :warehouse-id="locationWarehouseId"
                  @change="(item) => handleSelectorChange(item)"
                  class="!w-1/1"
                  placeholder="请选择库区"
                />
              </div>
            </template>
            <template v-else-if="formData.type === BarcodeBizTypeEnum.AREA">
              <div class="space-y-2">
                <WmWarehouseSelect
                  v-model="areaWarehouseId"
                  @change="handleAreaWarehouseChange"
                  class="!w-1/1"
                  placeholder="请选择仓库"
                />
                <WmWarehouseLocationSelect
                  v-model="areaLocationId"
                  :warehouse-id="areaWarehouseId"
                  @change="handleAreaLocationChange"
                  class="!w-1/1"
                  placeholder="请选择库区"
                />
                <WmWarehouseAreaSelect
                  v-model="formData.valueId"
                  :warehouse-id="areaWarehouseId"
                  @change="(item) => handleSelectorChange(item)"
                  class="!w-1/1"
                  placeholder="请选择库位"
                />
              </div>
            </template>
            <template v-else-if="formData.type === BarcodeBizTypeEnum.ITEM">
              <MdItemSelect
                v-model="formData.valueId"
                @change="(item) => handleSelectorChange(item)"
              />
            </template>
            <template v-else>
              <el-row :gutter="8" class="w-full">
                <el-col :span="8">
                  <el-input v-model="formData.valueId" placeholder="值ID" @change="handleManualChange" />
                </el-col>
                <el-col :span="8">
                  <el-input
                    v-model="formData.valueCode"
                    placeholder="值编码"
                    @change="handleManualChange"
                  />
                </el-col>
                <el-col :span="8">
                  <el-input
                    v-model="formData.valueName"
                    placeholder="值名称"
                    @change="handleManualChange"
                  />
                </el-col>
              </el-row>
            </template>
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
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import {
  StockTakingPlanParamApi,
  type StockTakingPlanParamVO
} from '@/api/mes/wm/stocktaking/plan/param/index'
import { BarcodeBizTypeEnum } from '@/views/mes/utils/constants'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'
import { WmWarehouseLocationApi } from '@/api/mes/wm/warehouse/location'
import { WmWarehouseAreaApi } from '@/api/mes/wm/warehouse/area'

defineOptions({ name: 'StockTakingPlanParamList' })

interface ParamRow extends StockTakingPlanParamVO {
  valueId?: number | string
}

const props = withDefaults(
  defineProps<{
    modelValue?: ParamRow[]
    planId?: number
    disabled?: boolean
  }>(),
  {
    modelValue: () => [],
    planId: undefined,
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: ParamRow[]]
}>()

const { t } = useI18n()
const message = useMessage()

// ==================== 列表 ====================
const loading = ref(false)
const list = ref<ParamRow[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  planId: undefined as number | undefined
})

// TODO @AI：isRemoteMode 字段不需要？
const isRemoteMode = computed(() => !!props.planId)
const localRows = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})
const displayList = computed(() => (isRemoteMode.value ? list.value : localRows.value))

/** 查询条件列表 */
const getList = async () => {
  if (!isRemoteMode.value || !props.planId) {
    list.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    queryParams.planId = props.planId
    const data = await StockTakingPlanParamApi.getStockTakingPlanParamPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 删除 */
const handleDelete = async (row: ParamRow) => {
  try {
    await message.delConfirm()
    if (isRemoteMode.value && row.id) {
      await StockTakingPlanParamApi.deleteStockTakingPlanParam(row.id)
      message.success(t('common.delSuccess'))
      // TODO @AI：不用这个；
      // 如果是最后一条且不是第一页，页码减1
      if (list.value.length === 1 && queryParams.pageNo > 1) {
        queryParams.pageNo -= 1
      }
      await getList()
      return
    }

    localRows.value = localRows.value.filter((item) => item !== row)
    message.success(t('common.delSuccess'))
  } catch {}
}

// ==================== 添加/编辑表单 ====================
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref<ParamRow>({
  id: undefined,
  planId: undefined,
  type: BarcodeBizTypeEnum.WAREHOUSE,
  valueId: undefined,
  valueCode: '',
  valueName: '',
  remark: ''
})
const formRules = reactive({
  type: [{ required: true, message: '请选择条件类型', trigger: 'change' }],
  valueId: [{ required: true, message: '条件值不能为空', trigger: 'change' }]
})
const formRef = ref()
const editingIndex = ref<number>(-1)

const locationWarehouseId = ref<number>() // 库区选择器的临时数据：选择仓库后，传给库区选择器
const areaWarehouseId = ref<number>() // 库位选择器的临时数据：选择仓库后，传给库位选择器
const areaLocationId = ref<number>() // 库位选择器的临时数据：选择库区后，传给库位选择器
const isLoadingData = ref(false) // 标记是否正在加载数据，避免 watch 清空字段

/** 打开表单弹窗 */
const openForm = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    isLoadingData.value = true
    try {
      formData.value = (await StockTakingPlanParamApi.getStockTakingPlanParam(id)) as ParamRow
      // 编辑时，需要回填级联选择器的中间层级数据
      await loadCascadeData()
    } finally {
      formLoading.value = false
      isLoadingData.value = false
    }
  } else if (type === 'update') {
    // 本地模式编辑
    const row = localRows.value.find((item) => item === id)
    if (row) {
      formData.value = { ...row }
      editingIndex.value = localRows.value.findIndex((item) => item === row)
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
      planId: props.planId,
      valueId: Number(formData.value.valueId)
    } as StockTakingPlanParamVO

    if (isRemoteMode.value && props.planId) {
      if (formType.value === 'create') {
        await StockTakingPlanParamApi.createStockTakingPlanParam(data)
        message.success(t('common.createSuccess'))
      } else {
        await StockTakingPlanParamApi.updateStockTakingPlanParam(data)
        message.success(t('common.updateSuccess'))
      }
      dialogVisible.value = false
      await getList()
      return
    }

    // 本地模式
    const nextRows = [...localRows.value]
    if (formType.value === 'create') {
      nextRows.push({ ...data, planId: undefined })
      message.success(t('common.createSuccess'))
    } else if (editingIndex.value > -1) {
      nextRows.splice(editingIndex.value, 1, { ...data, planId: undefined })
      message.success(t('common.updateSuccess'))
    }
    localRows.value = nextRows
    dialogVisible.value = false
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    planId: props.planId,
    type: BarcodeBizTypeEnum.WAREHOUSE,
    valueId: undefined,
    valueCode: '',
    valueName: '',
    remark: ''
  }
  editingIndex.value = -1
  formRef.value?.resetFields()
}

/** 条件类型变化 */
const handleTypeChange = () => {
  // 加载数据时不清空字段
  if (isLoadingData.value) {
    return
  }

  formData.value.valueId = undefined
  formData.value.valueCode = ''
  formData.value.valueName = ''
  // 清空仓库层级的临时数据
  locationWarehouseId.value = undefined
  areaWarehouseId.value = undefined
  areaLocationId.value = undefined
}

/** 选择器变化 */
const handleSelectorChange = (item?: any) => {
  formData.value.valueId = item?.id
  formData.value.valueCode = item?.code || ''
  formData.value.valueName = item?.name || item?.nickname || ''
}

/** 手动输入变化 */
const handleManualChange = () => {
  if (
    formData.value.valueId !== undefined &&
    formData.value.valueId !== null &&
    formData.value.valueId !== ''
  ) {
    const num = Number(formData.value.valueId)
    formData.value.valueId = Number.isNaN(num) ? formData.value.valueId : num
  }
}

/** 库区仓库选择回调：清空库区 */
const handleLocationWarehouseChange = () => {
  formData.value.valueId = undefined
  formData.value.valueCode = ''
  formData.value.valueName = ''
}

/** 库位仓库选择回调：清空库区和库位 */
const handleAreaWarehouseChange = () => {
  areaLocationId.value = undefined
  formData.value.valueId = undefined
  formData.value.valueCode = ''
  formData.value.valueName = ''
}

/** 库位库区选择回调：清空库位 */
const handleAreaLocationChange = () => {
  formData.value.valueId = undefined
  formData.value.valueCode = ''
  formData.value.valueName = ''
}

/** 加载级联选择器的数据（编辑时回填上级数据） */
const loadCascadeData = async () => {
  if (!formData.value.type || !formData.value.valueId) {
    return
  }
  try {
    // 库区类型：需要查询库区信息，获取所属仓库ID
    if (formData.value.type === BarcodeBizTypeEnum.LOCATION) {
      const location = await WmWarehouseLocationApi.getWarehouseLocation(formData.value.valueId)
      if (location?.warehouseId) {
        locationWarehouseId.value = location.warehouseId
      }
    }
    // 库位类型：需要查询库位信息，获取所属仓库ID和库区ID
    else if (formData.value.type === BarcodeBizTypeEnum.AREA) {
      const area = await WmWarehouseAreaApi.getWarehouseArea(formData.value.valueId)
      if (area?.warehouseId) {
        areaWarehouseId.value = area.warehouseId
      }
      if (area?.locationId) {
        areaLocationId.value = area.locationId
      }
    }
  } catch (error) {
    console.error('加载级联数据失败:', error)
  }
}

/** 监听 planId 变化 */
watch(
  () => props.planId,
  async (value) => {
    resetForm()
    if (!value) {
      queryParams.planId = undefined
      queryParams.pageNo = 1
      list.value = []
      total.value = 0
      return
    }
    queryParams.pageNo = 1
    await getList()
  },
  { immediate: true }
)
</script>
