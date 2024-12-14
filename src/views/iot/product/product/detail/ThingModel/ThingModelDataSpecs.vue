<template>
  <el-form-item label="数据类型" prop="dataType">
    <el-select v-model="formData.dataType" placeholder="请选择数据类型" @change="handleChange">
      <el-option
        v-for="option in dataTypeOptions"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
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
  <!-- 文本型配置 -->
  <el-form-item label="数据长度" prop="text" v-if="formData.dataType === DataSpecsDataType.TEXT">
    <el-input v-model="formData.length" class="w-255px!" placeholder="请输入文本字节长度">
      <template #append>字节</template>
    </el-input>
  </el-form-item>
  <!-- 时间型配置 -->
  <el-form-item label="时间格式" prop="date" v-if="formData.dataType === DataSpecsDataType.DATE">
    <el-input disabled class="w-255px!" placeholder="String类型的UTC时间戳（毫秒）" />
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { DataSpecsDataType, dataTypeOptions } from './config'
import { ThingModelEnumTypeDataSpecs, ThingModelNumberTypeDataSpecs } from './dataSpecs'

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
    case DataSpecsDataType.INT:
      formData.value.dataSpecs.dataType = DataSpecsDataType.INT
      break
    case DataSpecsDataType.DOUBLE:
      formData.value.dataSpecs.dataType = DataSpecsDataType.DOUBLE
      break
    case DataSpecsDataType.FLOAT:
      formData.value.dataSpecs.dataType = DataSpecsDataType.FLOAT
      break
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
      break
  }
}
</script>

<style lang="scss" scoped></style>
