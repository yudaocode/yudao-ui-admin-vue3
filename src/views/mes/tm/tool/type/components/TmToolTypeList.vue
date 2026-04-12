<!--
  MES 工具类型列表面板（左侧筛选）

  功能：加载工具类型列表 + 关键字过滤 + 点击节点通知父组件
  用法：<TmToolTypeList @node-click="handleTypeClick" />
  说明：
    - 工具类型为扁平列表（非树型），使用 el-tree 单层展示保持与其他模块一致的交互体验
    - 组件 mount 后自动加载数据，也可通过 ref 调用 loadList() 手动刷新
    - 支持 toggle：点击已选中节点会取消选中（emit undefined）
  Events:
    nodeClick(data: TmToolTypeVO | undefined) — 点击节点时触发；取消选中时为 undefined
  Expose:
    loadList() — 手动刷新类型列表
    clearCurrent() — 清除当前选中节点高亮
    reset() — 重置整个组件状态（清高亮 + 清搜索词）
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
    :data="listData"
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
import { TmToolTypeApi, TmToolTypeVO } from '@/api/mes/tm/tool/type'
import { Search as iconSearch } from '@element-plus/icons-vue'

defineOptions({ name: 'TmToolTypeList' })

const emit = defineEmits<{
  nodeClick: [data: TmToolTypeVO | undefined]
}>()

const treeRef = ref() // 树组件 Ref
const filterText = ref('') // 搜索关键字
const listData = ref<TmToolTypeVO[]>([]) // 列表数据（扁平，每项是独立根节点）
const treeProps = { children: 'children', label: 'name' } // 属性映射
let currentNodeId: number | undefined // 当前选中节点 ID（用于 toggle 判断）

/** 过滤节点（按名称匹配） */
const filterNode = (value: string, data: TmToolTypeVO) => {
  if (!value) {
    return true
  }
  return data.name?.includes(value)
}

/** 监听搜索关键字变化，触发过滤 */
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

/** 点击节点：支持 toggle（再次点击同一节点取消选中） */
const handleNodeClick = (data: TmToolTypeVO) => {
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

/** 加载类型列表数据 */
const loadList = async () => {
  // 扁平列表直接赋值（el-tree 每条记录作为独立根节点展示）
  listData.value = await TmToolTypeApi.getToolTypeSimpleList()
}

onMounted(() => {
  loadList()
})

/** 清除当前选中节点高亮 */
const clearCurrent = () => {
  treeRef.value?.setCurrentKey(undefined)
  currentNodeId = undefined
}

/** 重置整个组件状态（清高亮 + 清搜索词） */
const reset = () => {
  clearCurrent()
  filterText.value = ''
}

defineExpose({ loadList, clearCurrent, reset })
</script>
