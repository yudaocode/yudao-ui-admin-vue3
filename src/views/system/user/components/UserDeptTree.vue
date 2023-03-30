<template>
  <div class="head-container">
    <el-input v-model="deptName" placeholder="请输入部门名称" clearable style="margin-bottom: 20px">
      <template #prefix>
        <Icon icon="ep:search" />
      </template>
    </el-input>
  </div>
  <div class="head-container">
    <el-tree
      :data="deptOptions"
      :props="defaultProps"
      :expand-on-click-node="false"
      :filter-node-method="filterNode"
      ref="treeRef"
      node-key="id"
      default-expand-all
      highlight-current
      @node-click="handleDeptNodeClick"
    />
  </div>
</template>

<script setup lang="ts" name="UserDeptTree">
import { ElTree } from 'element-plus'
import * as DeptApi from '@/api/system/dept'
import { defaultProps, handleTree } from '@/utils/tree'

const emits = defineEmits(['node-click'])
const deptName = ref('')
const deptOptions = ref<Tree[]>([]) // 树形结构
const treeRef = ref<InstanceType<typeof ElTree>>()
const getTree = async () => {
  const res = await DeptApi.getSimpleDeptList()
  deptOptions.value = []
  deptOptions.value.push(...handleTree(res))
}

const filterNode = (value: string, data: Tree) => {
  if (!value) return true
  return data.name.includes(value)
}

const handleDeptNodeClick = async (row: { [key: string]: any }) => {
  emits('node-click', row)
}

onMounted(async () => {
  await getTree()
})
</script>
