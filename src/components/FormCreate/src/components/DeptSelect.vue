<!-- 部门选择器 - 树形结构显示 -->
<template>
  <el-tree-select
    v-model="selectedValue"
    class="w-1/1"
    :data="deptTree"
    :props="treeProps"
    :multiple="multiple"
    :disabled="disabled"
    :placeholder="placeholder || '请选择部门'"
    :check-strictly="true"
    :filterable="true"
    :filter-node-method="filterNode"
    :clearable="true"
    :render-after-expand="false"
    node-key="id"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import { isIdType, parseId } from '@/utils/id'

import { handleTree } from '@/utils/tree'
import { getSimpleDeptList, type DeptVO } from '@/api/system/dept'
import { useUserStoreWithOut } from '@/store/modules/user'

defineOptions({ name: 'DeptSelect' })

// 接受父组件参数
interface Props {
  modelValue?: number | string | number[] | string[]
  multiple?: boolean
  returnType?: 'id' | 'name'
  defaultCurrentDept?: boolean
  disabled?: boolean
  placeholder?: string
  formCreateInject?: any
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  returnType: 'id',
  defaultCurrentDept: false,
  disabled: false,
  placeholder: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | string | number[] | string[] | undefined): void
}>()

// 树形选择器配置
const treeProps = {
  label: 'name',
  value: 'id',
  children: 'children'
}

// 部门树形数据
const deptTree = ref<any[]>([])
// 原始部门列表（用于 returnType='name' 时查找名称）
const deptList = ref<DeptVO[]>([])
// 当前选中值
const selectedValue = ref<number | string | number[] | string[] | undefined>()

// 加载部门树形数据
const loadDeptTree = async () => {
  try {
    const data = await getSimpleDeptList()
    deptList.value = data
    deptTree.value = handleTree(data)
  } catch (error) {
    console.warn('加载部门数据失败:', error)
    deptTree.value = []
  }
}

// 根据 ID 获取部门名称
const getDeptNameById = (id?: number): string | undefined => {
  const dept = deptList.value.find((item) => item.id === id)
  return dept?.name
}

// 根据名称获取部门 ID
const getDeptIdByName = (name: string): number | undefined => {
  const dept = deptList.value.find((item) => item.name === name)
  return dept?.id
}

// 处理选中值变化
const handleChange = (value: number | number[] | undefined) => {
  if (value === undefined || value === null) {
    emit('update:modelValue', props.multiple ? [] : undefined)
    return
  }

  // 根据 returnType 决定返回值类型
  if (props.returnType === 'name') {
    if (props.multiple && Array.isArray(value)) {
      const names = value.map((id) => getDeptNameById(id)).filter(Boolean) as string[]
      emit('update:modelValue', names)
    } else if (!props.multiple && isIdType(value)) {
      const name = getDeptNameById(parseId(value))
      emit('update:modelValue', name)
    }
  } else {
    emit('update:modelValue', value)
  }
}

// 树节点过滤方法（支持搜索过滤）
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.name.includes(value)
}

// 监听 modelValue 变化，同步到内部选中值
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue === undefined || newValue === null) {
      selectedValue.value = props.multiple ? [] : undefined
      return
    }

    // 如果 returnType 是 'name'，需要将名称转换为 ID 用于树选择器显示
    if (props.returnType === 'name') {
      if (props.multiple && Array.isArray(newValue)) {
        const ids = (newValue as string[])
          .map((name) => getDeptIdByName(name))
          .filter(Boolean) as number[]
        selectedValue.value = ids
      } else if (!props.multiple && typeof newValue === 'string') {
        const id = getDeptIdByName(newValue)
        selectedValue.value = id
      }
    } else {
      selectedValue.value = newValue as number | number[]
    }
  },
  { immediate: true }
)

// 检查是否有有效的预设值
const hasValidPresetValue = (): boolean => {
  const value = props.modelValue
  if (value === undefined || value === null || value === '') {
    return false
  }
  if (Array.isArray(value)) {
    return value.length > 0
  }
  return true
}

// 是否处于表单设计器中：FcDesigner 会向其内部组件 provide('designer')，运行时表单无此注入
const designerCtx = inject('designer', null)

// 设置默认值（当前用户部门）
const setDefaultValue = () => {
  // 仅当 defaultCurrentDept 为 true 时处理
  if (!props.defaultCurrentDept) return

  // 表单设计器中不设置动态默认值：否则 emit 出去的值会被设计器双向绑定回写到 rule.value，
  // 随表单设计持久化后，运行时其他用户会拿到这个被污染的固定值，导致默认部门不再跟随当前登录用户。
  // 仅在「运行时」才设置. 不过会导致表单设计器预览时，无法看到默认值
  if (designerCtx !== null) return

  // 已有预设值则保留（优先级高于默认当前部门）：用于审批回显时保留发起人填写的真实值
  if (hasValidPresetValue()) return

  // 获取当前用户的部门 ID
  const userStore = useUserStoreWithOut()
  const user = userStore.getUser
  const deptId = user?.deptId

  // 处理 deptId 为空或 0 的边界情况
  if (!deptId || deptId === 0) return

  // 根据多选模式决定默认值格式
  const defaultValue = props.multiple ? [deptId] : deptId
  emit('update:modelValue', defaultValue)
}

// 组件挂载时加载数据并设置默认值
onMounted(async () => {
  await loadDeptTree()
  // 数据加载完成后设置默认值
  setDefaultValue()
})
</script>
