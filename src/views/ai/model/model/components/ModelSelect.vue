<!-- AI 模型选择器 -->
<template>
  <el-select v-bind="$attrs" v-model="selectValue" :placeholder="placeholder" filterable>
    <el-option v-for="item in list" :key="item.id" :label="item.name" :value="item.id" />
  </el-select>
</template>
<script lang="ts" setup>
import { ModelApi, ModelVO } from '@/api/ai/model/model'

/** AI 模型选择器 */
defineOptions({ name: 'AiModelSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    type?: number // 模型类型，参见 AiModelTypeEnum
    placeholder?: string
  }>(),
  {
    placeholder: '请选择模型'
  }
)
const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const list = ref<ModelVO[]>([]) // 模型列表
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 加载模型列表 */
const getList = async () => {
  list.value = await ModelApi.getModelSimpleList(props.type)
}

/** 监听模型类型变化 */
watch(() => props.type, getList, { immediate: true })
</script>
