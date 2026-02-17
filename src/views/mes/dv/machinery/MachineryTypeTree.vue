<template>
  <div class="head-container">
    <el-input v-model="filterName" class="mb-20px" clearable placeholder="请输入分类名称">
      <template #prefix>
        <Icon icon="ep:search" />
      </template>
    </el-input>
  </div>
  <div class="head-container">
    <el-tree
      ref="treeRef"
      :data="machineryTypeList"
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

<script lang="ts" setup>
import { ElTree } from 'element-plus'
import { DvMachineryTypeApi } from '@/api/mes/dv/machinery/type'
import { defaultProps, handleTree } from '@/utils/tree'

defineOptions({ name: 'MachineryTypeTree' })

const filterName = ref('')
const machineryTypeList = ref<Tree[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()

/** 获得分类树 */
const getTree = async () => {
  const res = await DvMachineryTypeApi.getMachineryTypeSimpleList()
  machineryTypeList.value = []
  machineryTypeList.value.push(...handleTree(res))
}

/** 基于名字过滤 */
const filterNode = (name: string, data: Tree) => {
  if (!name) {
    return true
  }
  return data.name.includes(name)
}

/** 处理分类被点击 */
let currentNode: any = {}
const handleNodeClick = async (row: { [key: string]: any }, treeNode: any) => {
  if (currentNode && currentNode.name === row.name) {
    treeNode.checked = !treeNode.checked
  } else {
    treeNode.checked = true
  }
  if (treeNode.checked) {
    currentNode = row
    emits('node-click', row)
  } else {
    treeRef.value!.setCurrentKey(undefined)
    emits('node-click', undefined)
    currentNode = null
  }
}
const emits = defineEmits(['node-click'])

/** 监听过滤名称 */
watch(filterName, (val) => {
  treeRef.value!.filter(val)
})

/** 初始化 */
onMounted(async () => {
  await getTree()
})
</script>
