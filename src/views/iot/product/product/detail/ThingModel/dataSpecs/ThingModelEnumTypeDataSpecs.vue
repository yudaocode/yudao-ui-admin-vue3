<template>
  <el-form-item label="枚举项" prop="enumItem">
    <div class="flex items-center justify-between">
      <span> 参数值 </span>
      <span> 参数描述 </span>
    </div>
    <div v-for="(item, index) in formData" :key="index" class="flex items-center justify-between">
      <el-input v-model="item.value" placeholder="请输入参数值" />
      <span class="mx-2">~</span>
      <el-input v-model="item.name" placeholder="请输入参数描述" />
    </div>
    <el-button link type="primary">+添加枚举项</el-button>
  </el-form-item>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'

/** 枚举型的 dataSpecs 配置组件 */
defineOptions({ name: 'ThingModelEnumTypeDataSpecs' })
const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const formData = useVModel(props, 'modelValue', emits)
</script>

<style lang="scss" scoped></style>
