<!-- AI1 知识库选择器 -->
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
import { KnowledgeBaseApi, KnowledgeBase } from '@/api/ai1/knowledge/base'

/** AI1 知识库选择器 */
defineOptions({ name: 'Ai1KnowledgeBaseSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number | number[]
    placeholder?: string
  }>(),
  {
    placeholder: '请选择知识库'
  }
)
const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
}>()

const list = ref<KnowledgeBase[]>([]) // 知识库列表
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 初始化 */
onMounted(async () => {
  list.value = await KnowledgeBaseApi.getKnowledgeBaseSimpleList()
})
</script>
