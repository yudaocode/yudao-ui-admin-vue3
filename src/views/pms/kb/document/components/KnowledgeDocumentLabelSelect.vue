<template>
  <el-select
    :model-value="modelValue"
    class="w-full"
    clearable
    multiple
    :loading="loading"
    placeholder="请选择标签"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-option v-for="label in labelList" :key="label.id" :label="label.name" :value="label.id" />
  </el-select>
</template>

<script lang="ts" setup>
import * as KnowledgeDocumentLabelApi from '@/api/pms/kb/content/document/label'

defineOptions({ name: 'PmsKnowledgeDocumentLabelSelect' })

defineProps<{
  modelValue: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const loading = ref(false)
const labelList = ref<KnowledgeDocumentLabelApi.PmsKnowledgeDocumentLabelVO[]>([])

onMounted(async () => {
  loading.value = true
  try {
    labelList.value = await KnowledgeDocumentLabelApi.getKnowledgeDocumentLabelList()
  } finally {
    loading.value = false
  }
})
</script>
