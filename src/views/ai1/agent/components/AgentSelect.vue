<!-- AI1 Agent 选择器 -->
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
import { AgentApi, Agent } from '@/api/ai1/agent'

/** AI1 Agent 选择器 */
defineOptions({ name: 'Ai1AgentSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    placeholder?: string
    status?: number // 状态，为空时不过滤
  }>(),
  {
    placeholder: '请选择 Agent'
  }
)
const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
}>()

const list = ref<Agent[]>([]) // Agent 列表
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 初始化 */
onMounted(async () => {
  list.value = await AgentApi.getAgentSimpleList(props.status)
})
</script>
