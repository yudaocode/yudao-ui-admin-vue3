<template>
  <el-form-item
    :rules="[{ required: true, message: '请选择数据类型', trigger: 'change' }]"
    label="数据类型"
    prop="property.dataType"
  >
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
  <el-form-item
    v-if="property.dataType === DataSpecsDataType.BOOL"
    :rules="[{ required: true, message: '请输入布尔值名称', trigger: 'blur' }]"
    label="布尔值"
    prop="property.dataSpecsList"
  >
    <template v-for="(item, index) in property.dataSpecsList" :key="item.value">
      <div class="flex items-center justify-start w-1/1 mb-5px">
        <span>{{ item.value }}</span>
        <span class="mx-2">-</span>
        <el-form-item
          :prop="`property.dataSpecsList[${index}].name`"
          :rules="[
            { required: true, message: '枚举描述不能为空' },
            { validator: validateBoolName, trigger: 'blur' }
          ]"
          class="flex-1 mb-0"
        >
          <el-input
            v-model="item.name"
            :placeholder="`如：${item.value === 0 ? '关' : '开'}`"
            class="w-255px!"
          />
        </el-form-item>
      </div>
    </template>
  </el-form-item>
  <!-- 文本型配置 -->
  <el-form-item
    v-if="property.dataType === DataSpecsDataType.TEXT"
    :rules="[
      { required: true, message: '请输入文本字节长度', trigger: 'blur' },
      { validator: validateTextLength, trigger: 'blur' }
    ]"
    label="数据长度"
    prop="property.dataSpecs.length"
  >
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
  <el-form-item
    :rules="[{ required: true, message: '请选择读写类型', trigger: 'change' }]"
    label="读写类型"
    prop="property.accessMode"
  >
    <el-radio-group v-model="property.accessMode">
      <el-radio label="rw">读写</el-radio>
      <el-radio label="r">只读</el-radio>
    </el-radio-group>
  </el-form-item>
  <el-form-item label="属性描述" prop="description">
    <el-input
      v-model="property.description"
      :maxlength="200"
      :rows="3"
      placeholder="请输入属性描述"
      type="textarea"
    />
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
import { ThingModelProperty } from 'src/api/iot/thingmodel'
import { isEmpty } from '@/utils/is'

/** IoT 物模型数据 */
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

// TODO @puhui999：一些校验的规则，是不是写到 utils 里。
/** 校验布尔值名称 */
const validateBoolName = (_: any, value: string, callback: any) => {
  if (isEmpty(value)) {
    callback(new Error('布尔值名称不能为空'))
    return
  }
  // 检查开头字符
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9]/.test(value)) {
    callback(new Error('布尔值名称必须以中文、英文字母或数字开头'))
    return
  }
  // 检查整体格式
  if (!/^[\u4e00-\u9fa5a-zA-Z0-9][a-zA-Z0-9\u4e00-\u9fa5_-]*$/.test(value)) {
    callback(new Error('布尔值名称只能包含中文、英文字母、数字、下划线和短划线'))
    return
  }
  // 检查长度（一个中文算一个字符）
  if (value.length > 20) {
    callback(new Error('布尔值名称长度不能超过20个字符'))
    return
  }

  callback()
}

/** 校验文本长度 */
const validateTextLength = (_: any, value: any, callback: any) => {
  if (isEmpty(value)) {
    callback(new Error('文本长度不能为空'))
    return
  }
  if (isNaN(Number(value))) {
    callback(new Error('文本长度必须是数字'))
    return
  }
  callback()
}
</script>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
