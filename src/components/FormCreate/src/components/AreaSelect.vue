<!-- 省市区选择器 (Element Plus 版本 - Vue3) -->
<template>
  <el-cascader
    v-model="selectedValue"
    class="w-full"
    :options="areaTree"
    :props="cascaderProps"
    :disabled="disabled"
    :placeholder="placeholder"
    :clearable="clearable"
    :show-all-levels="showAllLevels"
    :separator="separator"
    :loading="loading"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import { getAreaTree } from '@/api/system/area'
import { AreaLevelEnum } from '@/utils/constants'

defineOptions({ name: 'AreaSelect' })

interface AreaVO {
  id: number
  name: string
  code: string
  parentId?: number
  sort?: number
  status?: number
  children?: AreaVO[]
}

interface Props {
  modelValue?: number[] | string[]
  level?: typeof AreaLevelEnum[keyof typeof AreaLevelEnum]
  disabled?: boolean
  placeholder?: string
  clearable?: boolean
  showAllLevels?: boolean
  separator?: string
  formCreateInject?: any
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  level: AreaLevelEnum.DISTRICT,
  disabled: false,
  placeholder: '请选择省市区',
  clearable: true,
  showAllLevels: true,
  separator: '/'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[] | string[] | undefined): void
}>()

const cascaderProps = {
  label: 'name',
  value: 'id',
  children: 'children',
  checkStrictly: true, // 允许选择任意级别
  emitPath: true // 返回完整路径
} // Element Plus Cascader 的 props 配置

const areaTree = ref<AreaVO[]>([]) // 地区树形数据
const selectedValue = ref<number[] | undefined>() // 当前选中值
const loading = ref(false) // 加载状态

/** 加载地区树形数据 */
async function loadAreaTree(): Promise<void> {
  try {
    loading.value = true
    const data = await getAreaTree()
    // 根据 level 限制层级
    areaTree.value = filterTreeByLevel(data || [], props.level)
  } catch (error) {
    console.warn('[AreaSelect] 加载地区数据失败:', error)
    areaTree.value = []
  } finally {
    loading.value = false
  }
}

/** 根据层级过滤树形数据 */
function filterTreeByLevel(tree: AreaVO[], maxLevel: number): AreaVO[] {
  if (maxLevel <= 0) {
    return []
  }
  return tree.map((node) => {
    const newNode = { ...node }
    // 如果当前是最后一层，移除 children
    if (maxLevel === 1) {
      delete newNode.children
    } else if (node.children && node.children.length > 0) {
      // 递归处理子节点
      newNode.children = filterTreeByLevel(node.children, maxLevel - 1)
    }
    return newNode
  })
}

/** 处理选中值变化 */
function handleChange(value: number[] | undefined): void {
  if (value === undefined || value === null) {
    emit('update:modelValue', undefined)
    return
  }
  emit('update:modelValue', value)
}

/** 同步 modelValue 到内部选中值 */
function syncSelectedValue(): void {
  const newValue = props.modelValue
  if (newValue === undefined || newValue === null) {
    selectedValue.value = undefined
    return
  }

  // 确保是数组格式
  if (Array.isArray(newValue)) {
    selectedValue.value = newValue as number[]
  } else {
    selectedValue.value = [newValue as number]
  }
}

/** 监听 modelValue 变化 */
watch(() => props.modelValue, syncSelectedValue, { immediate: true })

/** 组件挂载时加载数据 */
onMounted(async () => {
  await loadAreaTree()
})
</script>
