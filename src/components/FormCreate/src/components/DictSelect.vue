<!-- 数据字典 Select 选择器 -->
<template>
  <el-select v-if="selectType === 'select'" class="w-1/1" v-bind="attrs">
    <el-option
      v-for="(dict, index) in getDictOptions"
      :key="index"
      :label="dict.label"
      :value="dict.value"
    />
  </el-select>
  <el-radio-group v-if="selectType === 'radio'" class="w-1/1" v-bind="attrs">
    <el-radio v-for="(dict, index) in getDictOptions" :key="index" :value="dict.value">
      {{ dict.label }}
    </el-radio>
  </el-radio-group>
  <el-checkbox-group v-if="selectType === 'checkbox'" class="w-1/1" v-bind="attrs">
    <el-checkbox
      v-for="(dict, index) in getDictOptions"
      :key="index"
      :label="dict.label"
      :value="dict.value"
    />
  </el-checkbox-group>
</template>

<script lang="ts" setup>
import { getBoolDictOptions, getIntDictOptions, getStrDictOptions } from '@/utils/dict'

defineOptions({ name: 'DictSelect' })

const attrs = useAttrs()

// 接受父组件参数
interface Props {
  dictType: string // 字典类型
  valueType?: 'str' | 'int' | 'bool' // 字典值类型
  selectType?: 'select' | 'radio' | 'checkbox' // 选择器类型，下拉框 select、多选框 checkbox、单选框 radio
  formCreateInject?: any
}

const props = withDefaults(defineProps<Props>(), {
  valueType: 'str',
  selectType: 'select'
})

// 获得字典配置
const getDictOptions = computed(() => {
  switch (props.valueType) {
    case 'str':
      return getStrDictOptions(props.dictType)
    case 'int':
      return getIntDictOptions(props.dictType)
    case 'bool':
      return getBoolDictOptions(props.dictType)
    default:
      return []
  }
})
</script>
