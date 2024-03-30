<template>
  <el-select :model-value="modelValue" class="w-1/1" v-bind="attrs" @change="changeValue">
    <template v-if="valueType === 'int'">
      <el-option
        v-for="(dict, index) in getIntDictOptions(dictType)"
        :key="index"
        :label="dict.label"
        :value="dict.value"
      />
    </template>
    <template v-if="valueType === 'str'">
      <el-option
        v-for="(dict, index) in getStrDictOptions(dictType)"
        :key="index"
        :label="dict.label"
        :value="dict.value"
      />
    </template>
    <template v-if="valueType === 'bool'">
      <el-option
        v-for="(dict, index) in getBoolDictOptions(dictType)"
        :key="index"
        :label="dict.label"
        :value="dict.value"
      />
    </template>
  </el-select>
</template>

<script lang="ts" setup>
import { getBoolDictOptions, getIntDictOptions, getStrDictOptions } from '@/utils/dict'

// 接受父组件参数
interface Props {
  modelValue?: any // 值
  dictType: string // 字典类型
  valueType: string // 字典值类型
}

withDefaults(defineProps<Props>(), {
  dictType: '',
  valueType: 'str'
})
const attrs = useAttrs()
defineOptions({ name: 'DictSelect' })
const emits = defineEmits<{
  (e: 'update:modelValue', v: any): void
}>()
const changeValue = (value: any) => {
  console.log(value)
  emits('update:modelValue', value)
}
</script>
