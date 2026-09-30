<!-- AI1 模型选择器 -->
<template>
  <el-select
    v-bind="$attrs"
    v-model="selectValue"
    :placeholder="providerId ? placeholder : '请先选择模型供应商'"
    :disabled="!providerId"
    class="w-1/1"
    filterable
  >
    <el-option v-for="item in list" :key="item.id" :label="item.name" :value="item.id!" />
  </el-select>
</template>
<script lang="ts" setup>
import { ModelApi, Model } from '@/api/ai1/model'

/** AI1 模型选择器 */
defineOptions({ name: 'Ai1ModelSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    providerId?: number // 模型供应商编号
    type?: number // 模型类型，参见 Ai1ModelTypeEnum
    placeholder?: string
  }>(),
  {
    placeholder: '请选择模型'
  }
)
const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const list = ref<Model[]>([]) // 模型列表
const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

/** 加载模型列表 */
const getList = async () => {
  list.value = props.providerId
    ? await ModelApi.getModelSimpleList(props.providerId, props.type)
    : []
}

/** 监听模型供应商变化 */
watch(() => props.providerId, getList, { immediate: true })
</script>
