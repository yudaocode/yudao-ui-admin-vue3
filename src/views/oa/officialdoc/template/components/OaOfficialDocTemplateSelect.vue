<template>
  <el-select
    :model-value="modelValue"
    :disabled="disabled"
    :clearable="clearable"
    :filterable="filterable"
    :loading="loading"
    :placeholder="placeholder"
    @update:model-value="handleChange"
  >
    <el-option
      v-for="template in templates"
      :key="template.id"
      :value="template.id!"
      :label="template.name"
    />
  </el-select>
</template>

<script setup lang="ts">
import * as TemplateApi from '@/api/oa/officialdoc/template'

defineOptions({ name: 'OaOfficialDocTemplateSelect' })

withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    filterable: true,
    placeholder: '请选择套红模板'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [value: number | undefined]
}>()

const templates = ref<TemplateApi.OfficialDocTemplateVO[]>([]) // 套红模板列表
const loading = ref(false) // 列表的加载中

/** 选中变化 */
function handleChange(value: unknown) {
  emit('update:modelValue', typeof value === 'number' ? value : undefined)
  emit('change', typeof value === 'number' ? value : undefined)
}

/** 获得套红模板列表 */
async function getList() {
  loading.value = true
  try {
    templates.value = await TemplateApi.getSimpleTemplateList()
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
