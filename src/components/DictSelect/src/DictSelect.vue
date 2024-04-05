<!-- 数据字典 Select 选择器 -->
<template>
  <el-select class="w-1/1" v-bind="attrs">
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
</script>
