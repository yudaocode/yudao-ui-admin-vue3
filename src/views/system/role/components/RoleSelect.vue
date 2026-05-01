<!-- 系统角色选择器：纯下拉，前端过滤（支持 name / code） -->
<template>
  <el-select
    v-model="selectValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    filterable
    :filter-method="handleFilter"
    class="!w-1/1"
    @change="handleChange"
  >
    <el-option
      v-for="item in filteredList"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    >
      <div class="flex items-center gap-8px">
        <span>{{ item.name }}</span>
        <el-tag v-if="item.code" size="small" type="info" class="ml-4px">
          {{ item.code }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { getSimpleRoleList, RoleVO } from '@/api/system/role'

defineOptions({ name: 'RoleSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    clearable?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    clearable: true,
    placeholder: '请选择角色'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: RoleVO | undefined]
}>()

const allList = ref<RoleVO[]>([])
const filteredList = ref<RoleVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（name + code） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.name?.toLowerCase().includes(keyword) ||
      item.code?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载角色列表 */
onMounted(async () => {
  allList.value = await getSimpleRoleList()
  filteredList.value = allList.value
})
</script>
