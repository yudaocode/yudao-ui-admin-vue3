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
  <!-- 布尔型配置 -->
  <el-form-item label="布尔值" prop="bool" v-if="formData.dataType === DataSpecsDataType.BOOL">
    <template v-for="item in formData.dataSpecsList" :key="item.value">
      <div class="flex items-center justify-start w-1/1 mb-5px">
        <span>{{ item.value }}</span>
        <span class="mx-2">-</span>
        <el-input
          v-model="item.name"
          class="w-255px!"
          :placeholder="`如：${item.value === 0 ? '关' : '开'}`"
        />
      </div>
    </template>
  </el-form-item>
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
        dataType: DataSpecsDataType.ENUM,
        name: '', // 枚举项的名称
        value: undefined // 枚举值
      })
      break
    case DataSpecsDataType.BOOL:
      for (let i = 0; i < 2; i++) {
        formData.value.dataSpecsList.push({
          dataType: DataSpecsDataType.BOOL,
          name: '', // 布尔值的名称
          value: i // 布尔值
        })
      }
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
