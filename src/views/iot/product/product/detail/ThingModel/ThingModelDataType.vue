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
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'

/** 物模型数据类型 */
defineOptions({ name: 'ThingModelDataType' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emits)
</script>

<style lang="scss" scoped></style>
