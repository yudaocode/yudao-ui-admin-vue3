<!-- dataType：array 数组类型 -->
<template>
  <el-form-item label="元素类型" prop="property.dataSpecs.childDataType">
    <el-radio-group v-model="dataSpecs.childDataType" @change="handleChange">
      <template v-for="item in dataTypeOptions" :key="item.value">
        <el-radio
          v-if="
            !(
              [DataSpecsDataType.ENUM, DataSpecsDataType.ARRAY, DataSpecsDataType.DATE] as any[]
            ).includes(item.value)
          "
          :value="item.value"
          class="w-1/3"
        >
          {{ `${item.value}(${item.label})` }}
        </el-radio>
      </template>
    </el-radio-group>
  </el-form-item>
  <el-form-item label="元素个数" prop="property.dataSpecs.size">
    <el-input v-model="dataSpecs.size" placeholder="请输入数组中的元素个数" />
  </el-form-item>
  <!-- Struct 型配置-->
  <ThingModelStructDataSpecs
    v-if="dataSpecs.childDataType === DataSpecsDataType.STRUCT"
    v-model="dataSpecs.dataSpecsList"
  />
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { DataSpecsDataType, dataTypeOptions } from '../config'
import ThingModelStructDataSpecs from './ThingModelStructDataSpecs.vue'

/** 数组型的 dataSpecs 配置组件 */
defineOptions({ name: 'ThingModelArrayDataSpecs' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const dataSpecs = useVModel(props, 'modelValue', emits) as Ref<any>

/** 元素类型改变时间。当值为 struct 时，对 dataSpecs 中的 dataSpecsList 进行初始化 */
const handleChange = (val: string) => {
  if (val !== DataSpecsDataType.STRUCT) {
    return
  }

  dataSpecs.value.dataSpecsList = []
}
</script>

<style lang="scss" scoped></style>
