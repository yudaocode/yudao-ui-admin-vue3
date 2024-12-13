<template>
  <el-form-item label="枚举项" prop="enumItem">
    <div class="flex flex-col">
      <div class="flex items-center justify-between">
        <span> 参数值 </span>
        <span> 参数描述 </span>
      </div>
      <div
        v-for="(item, index) in dataSpecsList"
        :key="index"
        class="flex items-center justify-between mb-5px"
      >
        <el-input v-model="item.value" placeholder="请输入枚举值,如'0'" />
        <span class="mx-2">~</span>
        <el-input v-model="item.name" placeholder="对该枚举项的描述" />
      </div>
      <el-button link type="primary" @click="addEnum">+添加枚举项</el-button>
    </div>
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { DataSpecsEnumDataVO } from '@/views/iot/product/product/detail/ThingModel/config'

/** 枚举型的 dataSpecs 配置组件 */
defineOptions({ name: 'ThingModelEnumTypeDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const dataSpecsList = useVModel(props, 'modelValue', emits) as Ref<DataSpecsEnumDataVO[]>

const addEnum = () => {
  dataSpecsList.value.push({
    dataType: 'ENUM',
    name: '', // 枚举项的名称
    value: undefined // 枚举值
  })
}
</script>

<style lang="scss" scoped></style>
