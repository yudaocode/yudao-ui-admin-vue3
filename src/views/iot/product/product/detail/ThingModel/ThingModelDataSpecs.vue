<template>
  <el-form-item label="数据类型" prop="dataType">
    <ThingModelDataType v-model="formData.dataType" @change="handleChange" />
  </el-form-item>
  <!-- 数值型配置 -->
  <ThingModelNumberTypeDataSpecs
    v-if="
      [DataSpecsDataType.INT, DataSpecsDataType.DOUBLE, DataSpecsDataType.FLOAT].includes(
        formData.dataType || ''
      )
    "
    v-model="formData.dataSpecs"
  />
  <!-- 枚举型配置 -->
  <ThingModelEnumTypeDataSpecs
    v-if="formData.dataType === DataSpecsDataType.ENUM"
    v-model="formData.dataSpecsList"
  />
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { DataSpecsDataType } from './config'
import {
  ThingModelDataType,
  ThingModelEnumTypeDataSpecs,
  ThingModelNumberTypeDataSpecs
} from './dataSpecs'

/** 物模型数据 */
defineOptions({ name: 'ThingModelDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emits) as Ref<any>

/** 属性值的数据类型切换时初始化相关数据 */
const handleChange = (dataType: any) => {
  formData.value.dataSpecsList = []
  formData.value.dataSpecs = {}

  switch (dataType) {
    case DataSpecsDataType.ENUM:
      formData.value.dataSpecsList.push({
        dataType: 'ENUM',
        name: '', // 枚举项的名称
        value: undefined // 枚举值
      })
  }
}
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
