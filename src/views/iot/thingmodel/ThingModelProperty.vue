<!-- 产品的物模型表单（property 项） -->
<template>
  <el-form-item
    :rules="[{ required: true, message: '请选择数据类型', trigger: 'change' }]"
    label="数据类型"
    prop="property.dataType"
  >
    <el-select v-model="property.dataType" placeholder="请选择数据类型" @change="handleChange">
      <!-- ARRAY 和 STRUCT 类型数据相互嵌套时，最多支持递归嵌套 2 层（父和子） -->
      <el-option
        v-for="option in getDataTypeOptions"
        :key="option.value"
        :label="`${option.value}(${option.label})`"
        :value="option.value"
      />
    </el-select>
  </el-form-item>
  <!-- 数值型配置 -->
  <ThingModelNumberDataSpecs
    v-if="
      [DataSpecsDataType.INT, DataSpecsDataType.DOUBLE, DataSpecsDataType.FLOAT].includes(
        property.dataType || ''
      )
    "
    v-model="property.dataSpecs"
  />
  <!-- 枚举型配置 -->
  <ThingModelEnumDataSpecs
    v-if="property.dataType === DataSpecsDataType.ENUM"
    v-model="property.dataSpecsList"
  />
  <!-- 布尔型配置 -->
  <el-form-item v-if="property.dataType === DataSpecsDataType.BOOL" label="布尔值">
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
    label="数据长度"
    prop="property.dataSpecs.length"
  >
    <el-input v-model="property.dataSpecs.length" class="w-255px!" placeholder="请输入文本字节长度">
      <template #append>字节</template>
    </el-input>
  </el-form-item>
  <!-- 时间型配置 -->
  <el-form-item v-if="property.dataType === DataSpecsDataType.DATE" label="时间格式" prop="date">
    <el-input class="w-255px!" disabled placeholder="String 类型的 UTC 时间戳（毫秒）" />
  </el-form-item>
  <!-- 数组型配置-->
  <ThingModelArrayDataSpecs
    v-if="property.dataType === DataSpecsDataType.ARRAY"
    v-model="property.dataSpecs"
  />
  <!-- Struct 型配置-->
  <ThingModelStructDataSpecs
    v-if="property.dataType === DataSpecsDataType.STRUCT"
    v-model="property.dataSpecsList"
  />
  <el-form-item v-if="!isStructDataSpecs && !isParams" label="读写类型" prop="property.accessMode">
    <el-radio-group v-model="property.accessMode">
      <el-radio :label="ThingModelAccessMode.READ_WRITE.value">
        {{ ThingModelAccessMode.READ_WRITE.label }}
      </el-radio>
      <el-radio :label="ThingModelAccessMode.READ_ONLY.value">
        {{ ThingModelAccessMode.READ_ONLY.label }}
      </el-radio>
    </el-radio-group>
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import {
  DataSpecsDataType,
  dataTypeOptions,
  ThingModelAccessMode,
  validateBoolName
} from './config'
import {
  ThingModelArrayDataSpecs,
  ThingModelEnumDataSpecs,
  ThingModelNumberDataSpecs,
  ThingModelStructDataSpecs
} from './dataSpecs'
import { ThingModelProperty } from '@/api/iot/thingmodel'
import { isEmpty } from '@/utils/is'

/** IoT 物模型属性 */
defineOptions({ name: 'ThingModelProperty' })

const props = defineProps<{ modelValue: any; isStructDataSpecs?: boolean; isParams?: boolean }>()
const emits = defineEmits(['update:modelValue'])
const property = useVModel(props, 'modelValue', emits) as Ref<ThingModelProperty>
const getDataTypeOptions = computed(() => {
  return !props.isStructDataSpecs
    ? dataTypeOptions
    : dataTypeOptions.filter(
        (item) =>
          !([DataSpecsDataType.STRUCT, DataSpecsDataType.ARRAY] as any[]).includes(item.value)
      )
}) // 获得数据类型列表

/** 属性值的数据类型切换时初始化相关数据 */
const handleChange = (dataType: any) => {
  property.value.dataSpecs = {}
  property.value.dataSpecsList = []
  // 不是列表型数据才设置 dataSpecs.dataType
  ![DataSpecsDataType.ENUM, DataSpecsDataType.BOOL, DataSpecsDataType.STRUCT].includes(dataType) &&
    (property.value.dataSpecs.dataType = dataType)
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

// 默认选中读写
watch(
  () => property.value.accessMode,
  (val: string) => {
    if (props.isStructDataSpecs || props.isParams) {
      return
    }
    isEmpty(val) && (property.value.accessMode = ThingModelAccessMode.READ_WRITE.value)
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
