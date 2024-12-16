<template>
  <el-form-item label="数据类型" prop="dataType">
    <el-select v-model="property.dataType" placeholder="请选择数据类型" @change="handleChange">
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
        property.dataType || ''
      )
    "
    v-model="property.dataSpecs"
  />
  <!-- 枚举型配置 -->
  <ThingModelEnumTypeDataSpecs
    v-if="property.dataType === DataSpecsDataType.ENUM"
    v-model="property.dataSpecsList"
  />
  <!-- 布尔型配置 -->
  <el-form-item v-if="property.dataType === DataSpecsDataType.BOOL" label="布尔值" prop="bool">
    <template v-for="item in property.dataSpecsList" :key="item.value">
      <div class="flex items-center justify-start w-1/1 mb-5px">
        <span>{{ item.value }}</span>
        <span class="mx-2">-</span>
        <el-input
          v-model="item.name"
          :placeholder="`如：${item.value === 0 ? '关' : '开'}`"
          class="w-255px!"
        />
      </div>
    </template>
  </el-form-item>
  <!-- 文本型配置 -->
  <el-form-item v-if="property.dataType === DataSpecsDataType.TEXT" label="数据长度" prop="text">
    <el-input v-model="property.dataSpecs.length" class="w-255px!" placeholder="请输入文本字节长度">
      <template #append>字节</template>
    </el-input>
  </el-form-item>
  <!-- 时间型配置 -->
  <el-form-item v-if="property.dataType === DataSpecsDataType.DATE" label="时间格式" prop="date">
    <el-input class="w-255px!" disabled placeholder="String类型的UTC时间戳（毫秒）" />
  </el-form-item>
  <!-- 数组型配置-->
  <ThingModelArrayTypeDataSpecs
    v-if="property.dataType === DataSpecsDataType.ARRAY"
    v-model="property.dataSpecs"
  />
  <!-- TODO puhui999: Struct 属性待完善 -->
  <el-form-item label="读写类型" prop="accessMode">
    <el-radio-group v-model="property.accessMode">
      <el-radio label="rw">读写</el-radio>
      <el-radio label="r">只读</el-radio>
    </el-radio-group>
  </el-form-item>
  <el-form-item label="属性描述" prop="description">
    <el-input v-model="property.description" placeholder="请输入属性描述" type="textarea" />
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { DataSpecsDataType, dataTypeOptions } from './config'
import {
  ThingModelArrayTypeDataSpecs,
  ThingModelEnumTypeDataSpecs,
  ThingModelNumberTypeDataSpecs
} from './dataSpecs'
import { ThingModelProperty } from '@/api/iot/thinkmodelfunction'

/** 物模型数据 */
defineOptions({ name: 'ThingModelDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const property = useVModel(props, 'modelValue', emits) as Ref<ThingModelProperty>

/** 属性值的数据类型切换时初始化相关数据 */
const handleChange = (dataType: any) => {
  property.value.dataSpecsList = []
  property.value.dataSpecs = {}

  property.value.dataSpecs.dataType = dataType
  switch (dataType) {
    case DataSpecsDataType.ENUM:
      property.value.dataSpecsList.push({
        dataType: DataSpecsDataType.ENUM,
        name: '', // 枚举项的名称
        value: undefined // 枚举值
      })
      break
    case DataSpecsDataType.BOOL:
      for (let i = 0; i < 2; i++) {
        property.value.dataSpecsList.push({
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
