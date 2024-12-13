<template>
  <el-form-item label="取值范围" prop="max">
    <div class="flex items-center justify-between">
      <el-input v-model="formData.min" placeholder="请输入最小值" />
      <span class="mx-2">~</span>
      <el-input v-model="formData.max" placeholder="请输入最大值" />
    </div>
  </el-form-item>
  <el-form-item label="步长" prop="step">
    <el-input v-model="formData.step" placeholder="请输入步长" />
  </el-form-item>
  <el-form-item label="单位" prop="unit">
    <el-select
      :model-value="formData.unit ? formData.unitName + '-' + formData.unit : ''"
      filterable
      placeholder="请选择单位"
      style="width: 240px"
      @change="unitChange"
    >
      <el-option
        v-for="(item, index) in UnifyUnitSpecsDTO"
        :key="index"
        :label="item.Name + '-' + item.Symbol"
        :value="item.Name + '-' + item.Symbol"
      />
    </el-select>
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { UnifyUnitSpecsDTO } from '@/views/iot/utils/constants'
import { DataSpecsNumberDataVO } from '../config'

/** 数值型的 dataSpecs 配置组件 */
defineOptions({ name: 'ThingModelNumberTypeDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emits) as Ref<DataSpecsNumberDataVO>

/** 单位发生变化时触发 */
const unitChange = (UnitSpecs: string) => {
  const [unitName, unit] = UnitSpecs.split('-')
  formData.value.unitName = unitName
  formData.value.unit = unit
}
</script>

<style lang="scss" scoped></style>
