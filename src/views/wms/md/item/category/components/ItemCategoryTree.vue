<!-- WMS 商品分类树组件 -->
<template>
  <div class="h-full">
    <el-input v-model="filterText" class="p-[15px]" clearable :placeholder="filterPlaceholder">
      <template #prefix>
        <Icon icon="ep:search" />
      </template>
    </el-input>
    <el-scrollbar class="!h-[calc(100%-32px-30px)]">
      <el-tree
        ref="treeRef"
        :data="categoryList"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        :props="defaultProps"
        default-expand-all
        highlight-current
        node-key="id"
        @node-click="handleNodeClick"
      />
    </el-scrollbar>
  </div>
</template>

<script lang="ts" setup>
import { ElTree } from 'element-plus'
import { defaultProps, handleTree } from '@/utils/tree'
import { ItemCategoryApi, ItemCategoryVO } from '@/api/wms/md/item/category'

/** WMS 商品分类树组件 */
defineOptions({ name: 'WmsItemCategoryTree' })

withDefaults(
  defineProps<{
    filterPlaceholder?: string // 搜索输入框占位文字
  }>(),
  {
    filterPlaceholder: '请输入分类名称'
  }
)

const emit = defineEmits<{
  'node-click': [categoryId: number | undefined]
}>()

const filterText = ref('') // 过滤关键字
const categoryList = ref<ItemCategoryVO[]>([]) // 分类树数据
const treeRef = ref<InstanceType<typeof ElTree>>() // 树 Ref
let currentNodeId: number | null = null // 当前选中的节点 ID

/** 加载分类树 */
const loadTree = async () => {
  const data = await ItemCategoryApi.getItemCategorySimpleList()
  categoryList.value = handleTree(data, 'id', 'parentId')
}

/** 基于名字过滤 */
const filterNode = (name: string, data: ItemCategoryVO) => {
  if (!name) {
    return true
  }
  return !!data.name?.includes(name)
}

/** 监听过滤关键字 */
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

/** 处理节点点击：支持点击同一节点取消选中 */
const handleNodeClick = (row: ItemCategoryVO) => {
  if (currentNodeId === row.id) {
    treeRef.value?.setCurrentKey(undefined)
    currentNodeId = null
    emit('node-click', undefined)
  } else {
    currentNodeId = row.id!
    emit('node-click', row.id)
  }
}

/** 清空选中状态 */
const reset = () => {
  currentNodeId = null
  filterText.value = ''
  treeRef.value?.setCurrentKey(undefined)
}

/** 设置当前选中分类 */
const setCurrent = (categoryId: number) => {
  treeRef.value?.setCurrentKey(categoryId)
}

defineExpose({ reset, setCurrent })

/** 初始化 */
onMounted(async () => {
  await loadTree()
})
</script>
