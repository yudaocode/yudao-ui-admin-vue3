<!--
  部门树选择组件（通用复用）

  功能：搜索输入框 + 部门树，支持点击同一节点取消选中
  Props:
    filterPlaceholder — 搜索输入框占位文字（默认 '请输入部门名称'）
  Events:
    node-click(deptId: number | undefined) — 点击节点后触发，取消选中时传 undefined
  Expose:
    reset() — 清空选中状态（供外部重置按钮调用）
-->
<template>
  <div>
    <el-input
      v-model="filterText"
      class="mb-15px"
      clearable
      :placeholder="filterPlaceholder"
    >
      <template #prefix>
        <Icon icon="ep:search" />
      </template>
    </el-input>
    <el-tree
      ref="treeRef"
      :data="deptList"
      :expand-on-click-node="false"
      :filter-node-method="filterNode"
      :props="defaultProps"
      default-expand-all
      highlight-current
      node-key="id"
      @node-click="handleNodeClick"
    />
  </div>
</template>

<script setup lang="ts">
import { ElTree } from 'element-plus'
import * as DeptApi from '@/api/system/dept'
import { defaultProps, handleTree } from '@/utils/tree'

defineOptions({ name: 'DeptTreeSelect' })

withDefaults(
  defineProps<{
    filterPlaceholder?: string // 搜索输入框占位文字
  }>(),
  {
    filterPlaceholder: '请输入部门名称'
  }
)

const emit = defineEmits<{
  'node-click': [deptId: number | undefined]
}>()

const filterText = ref('') // 过滤关键字
const deptList = ref<Tree[]>([]) // 部门树数据
const treeRef = ref<InstanceType<typeof ElTree>>() // 树 Ref
let currentNodeId: number | null = null // 当前选中的节点 ID

/** 加载部门树 */
const loadTree = async () => {
  const res = await DeptApi.getSimpleDeptList()
  deptList.value = handleTree(res)
}

/** 基于名字过滤 */
const filterNode = (name: string, data: Tree) => {
  if (!name) return true
  return data.name.includes(name)
}

/** 监听过滤关键字 */
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

/** 处理节点点击：支持点击同一节点取消选中 */
const handleNodeClick = (row: { [key: string]: any }) => {
  if (currentNodeId === row.id) {
    // 再次点击同一节点 → 取消选中
    treeRef.value?.setCurrentKey(undefined)
    currentNodeId = null
    emit('node-click', undefined)
  } else {
    // 选中新节点
    currentNodeId = row.id
    emit('node-click', row.id)
  }
}

/** 清空选中状态（供外部重置按钮调用） */
const reset = () => {
  currentNodeId = null
  filterText.value = ''
  treeRef.value?.setCurrentKey(undefined)
}

defineExpose({ reset })

/** 初始化 */
onMounted(async () => {
  await loadTree()
})
</script>
