<!-- TODO @芋艿：这里需要在 review 下； -->
<template>
  <div>
    <div class="mb-12px flex items-center justify-between">
      <span class="text-14px font-500">盘点范围参数</span>
      <el-button type="primary" plain @click="openForm('create')" :disabled="disabled || (isRemoteMode && !planId)">
        <Icon icon="ep:plus" class="mr-5px" /> 添加参数
      </el-button>
    </div>

    <el-table v-loading="loading" :data="displayList" border :show-overflow-tooltip="true" empty-text="暂无参数">
      <el-table-column label="参数类型" min-width="160">
        <template #default="scope">
          {{ getTypeLabel(scope.row.type) }}
        </template>
      </el-table-column>
      <el-table-column label="参数值 ID" min-width="120" prop="valueId" />
      <el-table-column label="参数值编码" min-width="160" prop="valueCode" />
      <el-table-column label="参数值名称" min-width="180" prop="valueName" />
      <el-table-column label="备注" min-width="180" prop="remark" />
      <el-table-column v-if="!disabled" label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row)">编辑</el-button>
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
          <el-form-item label="参数类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择参数类型"
              class="!w-full"
              @change="handleTypeChange"
            >
              <el-option
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_PARAM_TYPE)"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="参数值" prop="valueId">
            <template v-if="formData.type === MesWmStockTakingParamTypeEnum.WAREHOUSE">
              <WmWarehouseSelect
                v-model="formData.valueId"
                @change="(item) => handleSelectorChange(item)"
              />
            </template>
            <template v-else-if="formData.type === MesWmStockTakingParamTypeEnum.LOCATION">
              <WmWarehouseLocationSelect
                v-model="formData.valueId"
                @change="(item) => handleSelectorChange(item)"
              />
            </template>
            <template v-else-if="formData.type === MesWmStockTakingParamTypeEnum.AREA">
              <WmWarehouseAreaSelect
                v-model="formData.valueId"
                @change="(item) => handleSelectorChange(item)"
              />
            </template>
            <template v-else-if="formData.type === MesWmStockTakingParamTypeEnum.ITEM">
              <MdItemSelect v-model="formData.valueId" @change="(item) => handleSelectorChange(item)" />
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
import { MesWmStockTakingParamTypeEnum } from '@/views/mes/utils/constants'
import WmWarehouseSelect from '@/views/mes/wm/warehouse/components/WmWarehouseSelect.vue'
import WmWarehouseLocationSelect from '@/views/mes/wm/warehouse/components/WmWarehouseLocationSelect.vue'
import WmWarehouseAreaSelect from '@/views/mes/wm/warehouse/components/WmWarehouseAreaSelect.vue'
import MdItemSelect from '@/views/mes/md/item/components/MdItemSelect.vue'

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

const isRemoteMode = computed(() => !!props.planId)
const typeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_PARAM_TYPE))
const localRows = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const formLoading = ref(false)
const list = ref<ParamRow[]>([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  planId: undefined as number | undefined
})

const displayList = computed(() => (isRemoteMode.value ? list.value : localRows.value))

const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogType = ref<'create' | 'update'>('create')
const formRef = ref()
const formData = ref<ParamRow>({
  id: undefined,
  planId: undefined,
  type: MesWmStockTakingParamTypeEnum.WAREHOUSE,
  valueId: undefined,
  valueCode: '',
  valueName: '',
  remark: ''
})
const editingIndex = ref<number>(-1)
const formRules = reactive({
  type: [{ required: true, message: '请选择参数类型', trigger: 'change' }],
  valueId: [{ required: true, message: '参数值不能为空', trigger: 'change' }]
})

const getTypeLabel = (type?: number) => {
  return typeOptions.value.find((item) => item.value === type)?.label || ''
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    planId: props.planId,
    type: MesWmStockTakingParamTypeEnum.WAREHOUSE,
    valueId: undefined,
    valueCode: '',
    valueName: '',
    remark: ''
  }
  editingIndex.value = -1
  formRef.value?.resetFields()
}

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

const openForm = async (type: 'create' | 'update', row?: ParamRow) => {
  dialogVisible.value = true
  dialogType.value = type
  dialogTitle.value = type === 'create' ? '添加参数' : '编辑参数'
  resetForm()
  if (type === 'update' && row) {
    if (isRemoteMode.value && row.id) {
      formLoading.value = true
      try {
        formData.value = (await StockTakingPlanParamApi.getStockTakingPlanParam(row.id)) as ParamRow
      } finally {
        formLoading.value = false
      }
    } else {
      formData.value = { ...row }
      editingIndex.value = localRows.value.findIndex((item) => item === row)
    }
  }
}

const handleTypeChange = () => {
  formData.value.valueId = undefined
  formData.value.valueCode = ''
  formData.value.valueName = ''
}

const handleSelectorChange = (item?: any) => {
  formData.value.valueId = item?.id
  formData.value.valueCode = item?.code || ''
  formData.value.valueName = item?.name || item?.nickname || ''
}

const handleManualChange = () => {
  if (formData.value.valueId !== undefined && formData.value.valueId !== null && formData.value.valueId !== '') {
    const num = Number(formData.value.valueId)
    formData.value.valueId = Number.isNaN(num) ? formData.value.valueId : num
  }
}

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
      if (dialogType.value === 'create') {
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

    const nextRows = [...localRows.value]
    if (dialogType.value === 'create') {
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

const handleDelete = async (row: ParamRow) => {
  try {
    await message.delConfirm()
    if (isRemoteMode.value && row.id) {
      await StockTakingPlanParamApi.deleteStockTakingPlanParam(row.id)
      message.success(t('common.delSuccess'))
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
