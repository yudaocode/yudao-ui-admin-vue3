<!-- AI1 模型供应商选择器 -->
<template>
  <el-select
    v-bind="$attrs"
    v-model="selectValue"
    :placeholder="placeholder"
    class="w-1/1"
    filterable
    @change="handleChange"
  >
    <el-option v-for="item in list" :key="item.id" :label="item.name" :value="item.id!" />
  </el-select>
</template>
<script lang="ts" setup>
import { ProviderApi, Provider } from '@/api/ai1/model/provider'

/** AI1 模型供应商选择器 */
defineOptions({ name: 'Ai1ProviderSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    placeholder?: string
  }>(),
  {
    placeholder: '请选择模型供应商'
  }
)
const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [value: number | undefined]
}>()

const list = ref<Provider[]>([]) // 模型供应商列表
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 选中变化 */
const handleChange = (value: number | undefined) => {
  emit('change', value)
}

/** 初始化 */
onMounted(async () => {
  list.value = await ProviderApi.getProviderSimpleList()
})
</script>
