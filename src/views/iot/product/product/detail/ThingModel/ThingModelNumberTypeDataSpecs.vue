<template>
  <el-form-item label="取值范围" prop="max">
    <div class="flex items-center justify-between">
      <el-input v-model="formData.min" placeholder="请输入最小值" />
      <span class="mx-2">~</span>
      <el-input v-model="formData.max" placeholder="请输入最大值" />
    </div>
  </el-form-item>
  <el-form-item label="步长" prop="step">
    <el-input v-model="formData.step" placeholder="请输入步长" />
  </el-form-item>
  <el-form-item label="单位" prop="unit">
    <el-select
      :model-value="formData.unit ? formData.unitName + '-' + formData.unit : ''"
      filterable
      placeholder="请选择单位"
      style="width: 240px"
      @change="unitChange"
    >
      <el-option
        v-for="(item, index) in UnifyUnitSpecsDTO"
        :key="index"
        :label="item.Name + '-' + item.Symbol"
        :value="item.Name + '-' + item.Symbol"
      />
    </el-select>
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { UnifyUnitSpecsDTO } from '@/views/iot/utils/constants'

defineOptions({ name: 'ThingModelNumberTypeDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emits) as Ref<DataConfig>
type DataType = 'INT' | 'FLOAT' | 'DOUBLE'

interface DataConfig {
  dataType: DataType // 数据类型，取值为 INT、FLOAT 或 DOUBLE
  max: string // 最大值，必须与 dataType 设置一致，且为 STRING 类型
  min: string // 最小值，必须与 dataType 设置一致，且为 STRING 类型
  step: string // 步长，必须与 dataType 设置一致，且为 STRING 类型
  precise?: string // 精度，当 dataType 为 FLOAT 或 DOUBLE 时可选
  defaultValue?: string // 默认值，可选
  unit: string // 单位的符号
  unitName: string // 单位的名称
}

/** 单位发生变化时触发 */
const unitChange = (UnitSpecs: string) => {
  const [unitName, unit] = UnitSpecs.split('-')
  formData.value.unitName = unitName
  formData.value.unit = unit
}
</script>

<style lang="scss" scoped></style>
