<!-- TODO @芋艿：这里需要在 review 下； -->
<template>
  <div>
    <div class="mb-12px flex items-center justify-between">
      <span class="text-14px font-500">盘点范围参数</span>
      <el-button type="primary" plain @click="handleAdd" :disabled="disabled">
        <Icon icon="ep:plus" class="mr-5px" /> 添加参数
      </el-button>
    </div>
    <el-table :data="rows" border :show-overflow-tooltip="true" empty-text="暂无参数">
      <el-table-column label="参数类型" min-width="160">
        <template #default="scope">
          <el-select
            v-model="scope.row.type"
            placeholder="请选择参数类型"
            class="!w-full"
            :disabled="disabled"
            @change="handleTypeChange(scope.row)"
          >
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_PARAM_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="参数值" min-width="280">
        <template #default="scope">
          <template v-if="scope.row.type === MesWmStockTakingParamTypeEnum.WAREHOUSE">
            <WmWarehouseSelect
              v-model="scope.row.valueId"
              :disabled="disabled"
              @change="(item) => handleSelectorChange(scope.row, item)"
            />
          </template>
          <template v-else-if="scope.row.type === MesWmStockTakingParamTypeEnum.LOCATION">
            <WmWarehouseLocationSelect
              v-model="scope.row.valueId"
              :disabled="disabled"
              @change="(item) => handleSelectorChange(scope.row, item)"
            />
          </template>
          <template v-else-if="scope.row.type === MesWmStockTakingParamTypeEnum.AREA">
            <WmWarehouseAreaSelect
              v-model="scope.row.valueId"
              :disabled="disabled"
              @change="(item) => handleSelectorChange(scope.row, item)"
            />
          </template>
          <template v-else-if="scope.row.type === MesWmStockTakingParamTypeEnum.ITEM">
            <MdItemSelect
              v-model="scope.row.valueId"
              :disabled="disabled"
              @change="(item) => handleSelectorChange(scope.row, item)"
            />
          </template>
          <template v-else>
            <el-row :gutter="8">
              <el-col :span="8">
                <el-input
                  v-model="scope.row.valueId"
                  placeholder="值ID"
                  :disabled="disabled"
                  @change="handleManualChange(scope.row)"
                />
              </el-col>
              <el-col :span="8">
                <el-input
                  v-model="scope.row.valueCode"
                  placeholder="值编码"
                  :disabled="disabled"
                  @change="handleManualChange(scope.row)"
                />
              </el-col>
              <el-col :span="8">
                <el-input
                  v-model="scope.row.valueName"
                  placeholder="值名称"
                  :disabled="disabled"
                  @change="handleManualChange(scope.row)"
                />
              </el-col>
            </el-row>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="180">
        <template #default="scope">
          <el-input v-model="scope.row.remark" placeholder="请输入备注" :disabled="disabled" />
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="scope">
          <el-button link type="danger" :disabled="disabled" @click="handleDelete(scope.$index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { MesWmStockTakingParamTypeEnum } from '@/views/mes/utils/constants'
import type { StockTakingPlanParamVO } from '@/api/mes/wm/stocktaking/plan'
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
    disabled?: boolean
  }>(),
  {
    modelValue: () => [],
    disabled: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: ParamRow[]]
}>()

const rows = computed({
  get: () => props.modelValue || [],
  set: (value) => emit('update:modelValue', value)
})

const handleUpdate = () => {
  rows.value = [...rows.value]
}

const handleAdd = () => {
  rows.value = [
    ...rows.value,
    {
      type: MesWmStockTakingParamTypeEnum.WAREHOUSE,
      valueId: undefined,
      valueCode: '',
      valueName: '',
      remark: ''
    }
  ]
}

const handleDelete = (index: number) => {
  const list = [...rows.value]
  list.splice(index, 1)
  rows.value = list
}

const handleTypeChange = (row: ParamRow) => {
  row.valueId = undefined
  row.valueCode = ''
  row.valueName = ''
  handleUpdate()
}

const handleSelectorChange = (row: ParamRow, item?: any) => {
  row.valueId = item?.id
  row.valueCode = item?.code || ''
  row.valueName = item?.name || item?.nickname || ''
  handleUpdate()
}

const handleManualChange = (row: ParamRow) => {
  if (row.valueId !== undefined && row.valueId !== null && row.valueId !== '') {
    const num = Number(row.valueId)
    row.valueId = Number.isNaN(num) ? row.valueId : num
  }
  handleUpdate()
}
</script>
