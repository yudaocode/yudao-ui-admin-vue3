<script lang="ts" setup>
import { computed, CSSProperties, onBeforeUnmount, ref } from 'vue'
import { ElTree } from 'element-plus'

defineOptions({ name: 'Tree' })

interface TreeProps {
  data: any[]
  treeProps?: Record<string, any>
  width?: string
  height?: string
}

const props = defineProps<TreeProps>()

const emit = defineEmits<{
  (e: 'node-click', nodeData: any): void
  (e: 'node-expand', nodeData: any): void
  (e: 'node-collapse', nodeData: any): void
}>()

const treeContainer = ref<HTMLElement | null>(null)
const showTreeMenu = ref(false)
const contextNode = ref<any>(null)

const menuStyle = ref<CSSProperties>({})

const defaultWidth = '300px'
const defaultHeight = '400px'

// 关闭菜单，同时移除本组件注册在 document 上的监听
const closeTreeMenu = () => {
  showTreeMenu.value = false
  document.removeEventListener('click', closeTreeMenu)
  document.removeEventListener('contextmenu', closeTreeMenu)
}

// 右键菜单事件处理函数
// ElTree 存在 node-contextmenu 监听时会阻止该次右键事件冒泡，因此打开菜单的这次右键不会触发 document 上的关闭监听
const openTreeMenu = (event: MouseEvent, data: any) => {
  contextNode.value = data
  const container = treeContainer.value
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const nodeRect = (event.target as HTMLElement).getBoundingClientRect()

  // 计算菜单相对于父容器定位的坐标（加上容器滚动距离）
  const top = nodeRect.top - containerRect.top + container.scrollTop
  const left = nodeRect.left - containerRect.left + container.scrollLeft

  menuStyle.value = {
    position: 'absolute',
    top: `${top + 20}px`,
    left: `${left + 20}px`
  }

  showTreeMenu.value = true

  // 点击其他地方或再次右键关闭菜单
  document.addEventListener('click', closeTreeMenu)
  document.addEventListener('contextmenu', closeTreeMenu)
}

// 节点点击事件
const handleNodeClick = (data: any) => {
  emit('node-click', data)
  closeTreeMenu()
}

// 节点展开事件
const handleNodeExpand = (data: any) => {
  emit('node-expand', data)
  closeTreeMenu()
}

// 节点关闭事件
const handleNodeCollapse = (data: any) => {
  emit('node-collapse', data)
  closeTreeMenu()
}

// 计算容器样式，宽高随 props 变化
const containerStyle = computed<CSSProperties>(() => ({
  position: 'relative',
  overflow: 'auto',
  width: props.width ?? defaultWidth,
  height: props.height ?? defaultHeight
}))

// 菜单打开期间卸载时，移除 document 上的监听
onBeforeUnmount(() => {
  document.removeEventListener('click', closeTreeMenu)
  document.removeEventListener('contextmenu', closeTreeMenu)
})
</script>

<template>
  <div ref="treeContainer" :style="containerStyle" class="tree-container">
    <ElTree
      v-bind="treeProps"
      :data="data"
      @node-click="handleNodeClick"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
      @node-contextmenu="openTreeMenu"
    >
      <template #default="{ node }">
        <!-- 如果使用者提供了 render-node slot，则渲染使用者的内容 -->
        <template v-if="$slots['render-node']">
          <slot :node="node" name="render-node"></slot>
        </template>
        <!-- 否则使用默认节点显示（node.label） -->
        <template v-else>
          <span>{{ node.label }}</span>
        </template>
      </template>
    </ElTree>
    <div v-show="showTreeMenu" :style="menuStyle" class="treeMenu">
      <!-- 用户通过 context-menu slot 来自定义菜单内容 -->
      <slot :data="contextNode" :node="contextNode" name="context-menu">
        <div style="padding: 8px">未定义菜单</div>
      </slot>
    </div>
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped>
.treeMenu {
  position: absolute;
  padding: 5px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 5px;
  box-shadow: var(--el-box-shadow-light);

  &::after {
    position: absolute;

    /* 将箭头向上移动到菜单外部 */
    top: -6px;
    left: 50%;
    border-right: 6px solid transparent;
    border-bottom: 6px solid var(--el-border-color-light);

    /* 创建一个向上的箭头 */
    border-left: 6px solid transparent;
    content: '';
    transform: translateX(-50%);
  }
}
</style>
