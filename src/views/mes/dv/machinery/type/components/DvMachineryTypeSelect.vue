<!-- MES 设备类型选择器：树形下拉，只允许选择叶节点 -->
<template>
  <el-tooltip :disabled="!selectedItem" placement="top" :show-after="500">
    <template #content>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>备注：{{ selectedItem.remark || '-' }}</div>
      </div>
    </template>
    <el-tree-select
      v-bind="$attrs"
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
  </el-tooltip>
</template>

<script setup lang="ts">
import { DvMachineryTypeApi, DvMachineryTypeVO } from '@/api/mes/dv/machinery/type'
import { defaultProps, handleTree } from '@/utils/tree'

defineOptions({ name: 'DvMachineryTypeSelect', inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    disabled: false,
    placeholder: '请选择设备类型'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
  change: [item: DvMachineryTypeVO | undefined]
}>()

const allList = ref<DvMachineryTypeVO[]>([])
const treeData = ref<any[]>([])
const selectedItem = ref<DvMachineryTypeVO | undefined>() // 当前选中的分类对象（用于 tooltip 展示）

const selectValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleChange = (val: number | undefined) => {
  const item = allList.value.find((o) => o.id === val)
  selectedItem.value = item
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

/** 根据 modelValue 同步 selectedItem（用于编辑回显） */
watch(
  () => props.modelValue,
  (val) => {
    if (val == null) {
      selectedItem.value = undefined
      return
    }
    if (selectedItem.value?.id !== val && allList.value.length > 0) {
      selectedItem.value = allList.value.find((o) => o.id === val)
    }
  }
)

onMounted(async () => {
  allList.value = await DvMachineryTypeApi.getMachineryTypeSimpleList()
  treeData.value = markParentsDisabled(handleTree(allList.value))
  // 列表加载完成后，回显 selectedItem
  if (props.modelValue != null) {
    selectedItem.value = allList.value.find((o) => o.id === props.modelValue)
  }
})
</script>
