<template>
  <el-select
    v-model="formData.property.dataType.type"
    :disabled="!!formData.id"
    placeholder="请选择数据类型"
  >
    <el-option key="int" label="int32 (整数型)" value="int" />
    <el-option key="float" label="float (单精度浮点型)" value="float" />
    <el-option key="double" label="double (双精度浮点型)" value="double" />
    <el-option key="enum" label="enum(枚举型)" value="enum" />
    <el-option key="bool" label="bool (布尔型)" value="bool" />
    <el-option key="text" label="text (文本型)" value="text" />
    <el-option key="date" label="date (时间型)" value="date" />
    <el-option key="struct" label="struct (结构体)" value="struct" />
    <el-option key="array" label="array (数组)" value="array" />
  </el-select>
  <!-- 情况一：数值型 -->
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'

/** 物模型数据类型 */
defineOptions({ name: 'ThingModelDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emits)

// dataType为INT的dataSpecs示例：
//
// {
//   "dataSpecs": {
//   "custom": true,
//       "dataType": "INT",
//       "defaultValue": "30",
//       "max": "1440",
//       "min": "0",
//       "step": "10",
//       "unit": "min"
// }
// }
// dataType为TEXT的dataSpecs示例：
//
// {
//   "dataSpecs": {
//   "custom": true,
//       "dataType": "TEXT",
//       "id": 2412127,
//       "length": 2048
// }
// }
// dataType为ARRAY的dataSpecs示例：
//
// {
//   "dataSpecs": {
//   "childDataType": "INT",
//       "custom": true,
//       "dataType": "ARRAY",
//       "size": 1
// }
// }
// dataType为ENUM的dataSpecsList示例：
//
// {
//   "dataSpecsList": [
//   {
//     "custom": false,
//     "dataType": "ENUM",
//     "defaultValue": "true",
//     "name": "打开",
//     "value": 1
//   },
//   {
//     "custom": false,
//     "dataType": "ENUM",
//     "defaultValue": "false",
//     "name": "关闭",
//     "value": 0
//   }
// ]
// }
// dataType为STRUCT的dataSpecsList示例：
//
// {
//   "childDataType": "TEXT",
//     "childName": "卡编号",
//     "dataSpecs": {
//   "custom": true,
//       "dataType": "TEXT",
//       "length": 128
// },
//   "dataType": "STRUCT",
//     "identifier": "CardNo",
//     "name": "NVR所拥有的芯片信息"
// }
</script>

<style lang="scss" scoped></style>
