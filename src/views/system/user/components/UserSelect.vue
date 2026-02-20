<!-- 系统用户选择器：纯下拉，前端过滤（支持 nickname），展示部门 -->
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
      :label="item.nickname"
      :value="item.id"
    >
      <div class="flex items-center gap-8px">
        <span>{{ item.nickname }}</span>
        <el-tag v-if="item.deptName" size="small" type="info" class="ml-4px">
          {{ item.deptName }}
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'UserSelect' })

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
    placeholder: '请选择用户'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: UserApi.UserVO | undefined]
}>()

const allList = ref<UserApi.UserVO[]>([])
const filteredList = ref<UserApi.UserVO[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

/** 前端过滤（nickname + deptName） */
const handleFilter = (query: string) => {
  if (!query) {
    filteredList.value = allList.value
    return
  }
  const keyword = query.toLowerCase()
  filteredList.value = allList.value.filter(
    (item) =>
      item.nickname?.toLowerCase().includes(keyword) ||
      (item as any).deptName?.toLowerCase().includes(keyword)
  )
}

/** 选中变化 */
const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 加载用户列表 */
onMounted(async () => {
  allList.value = await UserApi.getSimpleUserList()
  filteredList.value = allList.value
})
</script>
