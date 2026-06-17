<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="loading"
    class="w-full"
    filterable
    clearable
    @update:model-value="handleChange"
  >
    <el-option
      v-for="template in templateList"
      :key="template.id"
      :label="`${template.name}（${template.code}）`"
      :value="template.code"
    />
  </el-select>
</template>

<script setup lang="ts">
import {
  getSimpleNotifyTemplateList,
  type NotifyTemplateSimpleVO
} from '@/api/system/notify/template'

/** 站内信模板下拉选择器 */
defineOptions({ name: 'NotifyTemplateSelect' })

withDefaults(
  defineProps<{
    disabled?: boolean
    modelValue?: string
    placeholder?: string
  }>(),
  {
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择站内信模板'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value?: string): void
  (e: 'change', value?: string): void
}>()

const loading = ref(false)
const templateList = ref<NotifyTemplateSimpleVO[]>([])

const handleChange = (value?: string) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const getTemplateList = async () => {
  try {
    loading.value = true
    templateList.value = (await getSimpleNotifyTemplateList()) || []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getTemplateList()
})
</script>
