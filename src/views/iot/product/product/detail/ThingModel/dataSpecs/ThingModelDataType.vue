<template>
  <el-select v-model="dataType" placeholder="请选择数据类型" @change="handleChange">
    <el-option
      v-for="option in dataTypeOptions"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { DataSpecsDataType } from '../config'

/** 物模型数据类型 */
defineOptions({ name: 'ThingModelDataType' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue', 'change'])
const dataType = useVModel(props, 'modelValue', emits)

const dataTypeOptions = [
  { value: DataSpecsDataType.INT, label: 'int32 (整数型)' },
  { value: DataSpecsDataType.FLOAT, label: 'float (单精度浮点型)' },
  { value: DataSpecsDataType.DOUBLE, label: 'double (双精度浮点型)' },
  { value: DataSpecsDataType.ENUM, label: 'enum(枚举型)' },
  { value: DataSpecsDataType.BOOL, label: 'bool (布尔型)' },
  { value: DataSpecsDataType.TEXT, label: 'text (文本型)' },
  { value: DataSpecsDataType.DATE, label: 'date (时间型)' },
  { value: DataSpecsDataType.STRUCT, label: 'struct (结构体)' },
  { value: DataSpecsDataType.ARRAY, label: 'array (数组)' }
]
const handleChange = (value: any) => {
  emits('change', value)
}
</script>

<style lang="scss" scoped></style>
