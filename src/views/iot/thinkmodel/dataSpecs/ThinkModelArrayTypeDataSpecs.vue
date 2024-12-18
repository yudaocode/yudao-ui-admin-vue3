<template>
  <el-form-item
    :rules="[{ required: true, message: '元素类型不能为空' }]"
    label="元素类型"
    prop="property.dataSpecs.childDataType"
  >
    <el-radio-group v-model="dataSpecs.childDataType">
      <template v-for="item in dataTypeOptions" :key="item.value">
        <el-radio
          v-if="
            !(
              [DataSpecsDataType.ENUM, DataSpecsDataType.ARRAY, DataSpecsDataType.DATE] as any[]
            ).includes(item.value)
          "
          :value="item.value"
        >
          {{ item.label }}
        </el-radio>
      </template>
    </el-radio-group>
  </el-form-item>
  <el-form-item
    :rules="[
      { required: true, message: '元素个数不能为空' },
      { validator: validateSize, trigger: 'blur' }
    ]"
    label="元素个数"
    prop="property.dataSpecs.size"
  >
    <el-input v-model="dataSpecs.size" placeholder="请输入数组中的元素个数" />
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { DataSpecsDataType, dataTypeOptions } from '../config'
import { isEmpty } from '@/utils/is'

/** 数组型的 dataSpecs 配置组件 */
defineOptions({ name: 'ThinkModelArrayTypeDataSpecs' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const dataSpecs = useVModel(props, 'modelValue', emits) as Ref<any>

/** 校验元素个数 */
const validateSize = (_: any, value: any, callback: any) => {
  if (isEmpty(value)) {
    callback(new Error('元素个数不能为空'))
    return
  }
  if (isNaN(Number(value))) {
    callback(new Error('元素个数必须是数字'))
    return
  }
  callback()
}
</script>

<style lang="scss" scoped></style>
