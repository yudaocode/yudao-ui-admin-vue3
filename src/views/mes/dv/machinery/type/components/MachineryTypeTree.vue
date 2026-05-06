<!--
  MES 设备类型树面板

  功能：加载设备类型树 + 关键字过滤 + 点击节点通知父组件
  用法：<MachineryTypeTree @node-click="handleTypeClick" />
  说明：
    - 组件 mount 后自动加载数据，也可通过 ref 调用 loadTree() 手动刷新
    - 支持 toggle：点击已选中节点会取消选中（emit undefined）
  Events:
    nodeClick(data: DvMachineryTypeVO | undefined) — 点击树节点时触发；取消选中时为 undefined
  Expose:
    loadTree() — 手动刷新分类树
    clearCurrent() — 清除当前选中节点高亮
    reset() — 重置整个树状态（清高亮 + 清搜索词）
-->
<template>
  <el-input
    v-model="filterText"
    placeholder="搜索分类"
    clearable
    class="mb-12px"
    :prefix-icon="iconSearch"
  />
  <el-tree
    ref="treeRef"
    :data="treeData"
    :props="treeProps"
    :expand-on-click-node="false"
    :filter-node-method="filterNode"
    default-expand-all
    highlight-current
    node-key="id"
    @node-click="handleNodeClick"
  />
</template>

<script setup lang="ts">
import { DvMachineryTypeApi, DvMachineryTypeVO } from '@/api/mes/dv/machinery/type'
import { handleTree } from '@/utils/tree'
import { Search as iconSearch } from '@element-plus/icons-vue'

defineOptions({ name: 'MachineryTypeTree' })

const emit = defineEmits<{
  nodeClick: [data: DvMachineryTypeVO | undefined]
}>()

const treeRef = ref() // 树组件 Ref
const filterText = ref('') // 搜索关键字
const treeData = ref<DvMachineryTypeVO[]>([]) // 树形数据
const treeProps = { children: 'children', label: 'name' } // 树属性映射
let currentNodeId: number | undefined // 当前选中节点 ID（用于 toggle 判断）

/** 过滤树节点（按名称匹配） */
const filterNode = (value: string, data: DvMachineryTypeVO) => {
  if (!value) {
    return true
  }
  return data.name?.includes(value)
}

/** 监听搜索关键字变化，触发树过滤 */
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

/** 点击树节点：支持 toggle（再次点击同一节点取消选中） */
const handleNodeClick = (data: DvMachineryTypeVO) => {
  if (currentNodeId === data.id) {
    // 再次点击同一节点：取消选中
    treeRef.value?.setCurrentKey(undefined)
    currentNodeId = undefined
    emit('nodeClick', undefined)
  } else {
    // 选中新节点
    currentNodeId = data.id
    emit('nodeClick', data)
  }
}

/** 加载分类树数据 */
const loadTree = async () => {
  const list = await DvMachineryTypeApi.getMachineryTypeSimpleList()
  treeData.value = handleTree(list)
}

onMounted(() => {
  loadTree()
})

/** 清除当前选中节点高亮 */
const clearCurrent = () => {
  treeRef.value?.setCurrentKey(undefined)
  currentNodeId = undefined
}

/** 重置整个树状态（清高亮 + 清搜索词） */
const reset = () => {
  clearCurrent()
  filterText.value = ''
}

defineExpose({ loadTree, clearCurrent, reset })
</script>
