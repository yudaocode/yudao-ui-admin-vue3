<template>
  <el-form-item label="元素类型" prop="childDataType">
    <el-radio-group v-model="dataSpecs.childDataType">
      <template v-for="item in dataTypeOptions" :key="item.value">
        <el-radio
          :value="item.value"
          v-if="
            !(
              [DataSpecsDataType.ENUM, DataSpecsDataType.ARRAY, DataSpecsDataType.DATE] as any[]
            ).includes(item.value)
          "
        >
          {{ item.label }}
        </el-radio>
      </template>
    </el-radio-group>
  </el-form-item>
  <el-form-item label="元素个数" prop="size">
    <el-input v-model="dataSpecs.size" placeholder="请输入数组中的元素个数" />
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { DataSpecsDataType, dataTypeOptions } from '../config'

/** 数值型的 dataSpecs 配置组件 */
defineOptions({ name: 'ThingModelArrayTypeDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const dataSpecs = useVModel(props, 'modelValue', emits) as Ref<any>
</script>

<style lang="scss" scoped></style>
