<template>
  <el-select
    :clearable="clearable"
    :disabled="disabled"
    :filterable="filterable"
    :loading="loading"
    :model-value="modelValue"
    :multiple="multiple"
    :placeholder="placeholder"
    collapse-tags
    collapse-tags-tooltip
    @update:model-value="handleChange"
  >
    <el-option
      v-for="library in libraryList"
      :key="library.id"
      :label="library.name"
      :value="library.id"
    />
  </el-select>
</template>

<script lang="ts" setup>
import * as KnowledgeLibraryApi from '@/api/pms/kb/library'
import { getAllPageItems } from '@/utils/page'

defineOptions({ name: 'PmsKnowledgeLibrarySelect' })

withDefaults(
  defineProps<{
    modelValue?: number | number[]
    multiple?: boolean
    disabled?: boolean
    clearable?: boolean
    filterable?: boolean
    placeholder?: string
  }>(),
  {
    multiple: false,
    disabled: false,
    clearable: true,
    filterable: true,
    placeholder: '请选择知识库'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | number[] | undefined]
  change: [value: number | number[] | undefined]
}>() // 定义 modelValue 更新和 change 事件

const loading = ref(false) // 知识库列表加载中
const libraryList = ref<KnowledgeLibraryApi.PmsKnowledgeLibraryVO[]>([]) // 可访问的知识库列表

/** 处理选中值变化 */
function handleChange(value: number | number[] | undefined) {
  emit('update:modelValue', value)
  emit('change', value)
}

/** 查询可访问的知识库列表 */
async function getKnowledgeLibraryList() {
  loading.value = true
  try {
    libraryList.value = await getAllPageItems<KnowledgeLibraryApi.PmsKnowledgeLibraryVO>(
      (pageNo, pageSize) => KnowledgeLibraryApi.getKnowledgeLibraryPage({ pageNo, pageSize })
    )
  } finally {
    loading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getKnowledgeLibraryList()
})
</script>
