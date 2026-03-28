<!-- MES 物料分类选择器：树形下拉，只允许选择叶节点 -->
<template>
  <el-tree-select
    v-model="selectValue"
    :data="treeData"
    :props="defaultProps"
    :placeholder="placeholder"
    :disabled="disabled"
    check-strictly
    default-expand-all
    filterable
    class="!w-1/1"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { MdItemTypeApi, MdItemTypeVO } from '@/api/mes/md/item/type'
import { defaultProps, handleTree } from '@/utils/tree'

defineOptions({ name: 'MdItemTypeSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    placeholder: '请选择物料分类'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: MdItemTypeVO | undefined]
}>()

const allList = ref<MdItemTypeVO[]>([])
const treeData = ref<any[]>([])

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  emit('change', item)
}

/** 递归将有子节点的分支节点标记为 disabled */
const markParentsDisabled = (nodes: any[]): any[] => {
  return nodes.map((node) => {
    if (node.children?.length) {
      return { ...node, disabled: true, children: markParentsDisabled(node.children) }
    }
    return node
  })
}

onMounted(async () => {
  allList.value = await MdItemTypeApi.getItemTypeSimpleList()
  treeData.value = markParentsDisabled(handleTree(allList.value))
})
</script>
