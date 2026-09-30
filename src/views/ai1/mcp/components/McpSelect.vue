<!-- AI1 MCP 选择器 -->
<template>
  <el-select
    v-bind="$attrs"
    v-model="selectValue"
    :placeholder="placeholder"
    class="w-1/1"
    filterable
  >
    <el-option v-for="item in list" :key="item.id" :label="item.name" :value="item.id!" />
  </el-select>
</template>
<script lang="ts" setup>
import { McpApi, Mcp } from '@/api/ai1/mcp'

/** AI1 MCP 选择器 */
defineOptions({ name: 'Ai1McpSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    placeholder?: string
  }>(),
  {
    placeholder: '请选择 MCP'
  }
)
const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
}>()

const list = ref<Mcp[]>([]) // MCP 列表
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 初始化 */
onMounted(async () => {
  list.value = await McpApi.getMcpSimpleList()
})
</script>
