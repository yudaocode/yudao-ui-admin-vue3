<template>
  <div class="simple-process-model-container position-relative">
    <div class="position-absolute top-0px right-0px bg-#fff z-index-button-group">
      <el-row type="flex" justify="end">
        <el-button-group key="scale-control" size="default">
          <el-button v-if="!readonly" size="default" @click="exportJson">
            <Icon icon="ep:download" /> 导出
          </el-button>
          <el-button v-if="!readonly" size="default" @click="importJson">
            <Icon icon="ep:upload" />导入
          </el-button>
          <!-- 用于打开本地文件-->
          <input
            v-if="!readonly"
            type="file"
            id="files"
            ref="refFile"
            style="display: none"
            accept=".json"
            @change="importLocalFile"
          />
          <el-button size="default" :icon="ScaleToOriginal" @click="processReZoom()" />
          <el-button size="default" :plain="true" :icon="ZoomOut" @click="zoomOut()" />
          <el-button size="default" class="w-80px"> {{ scaleValue }}% </el-button>
          <el-button size="default" :plain="true" :icon="ZoomIn" @click="zoomIn()" />
          <el-button size="default" @click="resetPosition">重置</el-button>
        </el-button-group>
      </el-row>
    </div>
    <div
      class="simple-process-model"
      :style="`transform: translate(${currentX}px, ${currentY}px) scale(${scaleValue / 100});`"
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="stopDrag"
      @mouseleave="stopDrag"
      @mouseenter="setGrabCursor"
    >
      <ProcessNodeTree v-if="processNodeTree" v-model:flow-node="processNodeTree" />
    </div>
  </div>
  <Dialog v-model="errorDialogVisible" title="保存失败" width="400" :fullscreen="false">
    <div class="mb-2">以下节点内容不完善，请修改后保存</div>
    <div
      class="mb-3 b-rounded-1 bg-gray-100 p-2 line-height-normal"
      v-for="(item, index) in errorNodes"
      :key="index"
    >
      {{ item.name }} : {{ NODE_DEFAULT_TEXT.get(item.type) }}
    </div>
    <template #footer>
      <el-button type="primary" @click="errorDialogVisible = false">知道了</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import ProcessNodeTree from './ProcessNodeTree.vue'
import { SimpleFlowNode, NodeType, NODE_DEFAULT_TEXT } from './consts'
import { useWatchNode } from './node'
import { ZoomOut, ZoomIn, ScaleToOriginal } from '@element-plus/icons-vue'
import { isString } from '@/utils/is'
import download from '@/utils/download'

defineOptions({
  name: 'SimpleProcessModel'
})

const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    required: true
  },
  readonly: {
    type: Boolean,
    required: false,
    default: true
  }
})

const emits = defineEmits<{
  save: [node: SimpleFlowNode | undefined]
}>()

const processNodeTree = useWatchNode(props)

provide('readonly', props.readonly)

// TODO 可优化：拖拽有点卡顿
/** 拖拽、放大缩小等操作 */
let scaleValue = ref(100)
const MAX_SCALE_VALUE = 200
const MIN_SCALE_VALUE = 50
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const currentX = ref(0)
const currentY = ref(0)
const initialX = ref(0)
const initialY = ref(0)

const setGrabCursor = () => {
  document.body.style.cursor = 'grab'
}

const resetCursor = () => {
  document.body.style.cursor = 'default'
}

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  startX.value = e.clientX - currentX.value
  startY.value = e.clientY - currentY.value
  setGrabCursor() // 设置小手光标
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  e.preventDefault() // 禁用文本选择

  // 使用 requestAnimationFrame 优化性能
  requestAnimationFrame(() => {
    currentX.value = e.clientX - startX.value
    currentY.value = e.clientY - startY.value
  })
}

const stopDrag = () => {
  isDragging.value = false
  resetCursor() // 重置光标
}

const zoomIn = () => {
  if (scaleValue.value == MAX_SCALE_VALUE) {
    return
  }
  scaleValue.value += 10
}

const zoomOut = () => {
  if (scaleValue.value == MIN_SCALE_VALUE) {
    return
  }
  scaleValue.value -= 10
}

const processReZoom = () => {
  scaleValue.value = 100
}

const resetPosition = () => {
  currentX.value = initialX.value
  currentY.value = initialY.value
}

/** 校验节点设置 */
const errorDialogVisible = ref(false)
let errorNodes: SimpleFlowNode[] = []

const validateNode = (node: SimpleFlowNode | undefined, errorNodes: SimpleFlowNode[]) => {
  if (node) {
    const { type, showText, conditionNodes } = node
    if (type == NodeType.END_EVENT_NODE) {
      return
    }
    if (type == NodeType.START_USER_NODE) {
      // 发起人节点暂时不用校验，直接校验孩子节点
      validateNode(node.childNode, errorNodes)
    }

    if (
      type === NodeType.USER_TASK_NODE ||
      type === NodeType.COPY_TASK_NODE ||
      type === NodeType.CONDITION_NODE
    ) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }

    if (
      type == NodeType.CONDITION_BRANCH_NODE ||
      type == NodeType.PARALLEL_BRANCH_NODE ||
      type == NodeType.INCLUSIVE_BRANCH_NODE
    ) {
      // 分支节点
      // 1. 先校验各个分支
      conditionNodes?.forEach((item) => {
        validateNode(item, errorNodes)
      })
      // 2. 校验孩子节点
      validateNode(node.childNode, errorNodes)
    }
  }
}

/** 获取当前流程数据 */
const getCurrentFlowData = async () => {
  try {
    errorNodes = []
    validateNode(processNodeTree.value, errorNodes)
    if (errorNodes.length > 0) {
      errorDialogVisible.value = true
      return undefined
    }
    return processNodeTree.value
  } catch (error) {
    console.error('获取流程数据失败:', error)
    return undefined
  }
}

defineExpose({
  getCurrentFlowData
})

/** 导出 JSON */
const exportJson = () => {
  download.json(new Blob([JSON.stringify(processNodeTree.value)]), 'model.json')
}

/** 导入 JSON */
const refFile = ref()
const importJson = () => {
  refFile.value.click()
}
const importLocalFile = () => {
  const file = refFile.value.files[0]
  const reader = new FileReader()
  reader.readAsText(file)
  reader.onload = function () {
    if (isString(this.result)) {
      processNodeTree.value = JSON.parse(this.result)
      emits('save', processNodeTree.value)
    }
  }
}

// 在组件初始化时记录初始位置
onMounted(() => {
  initialX.value = currentX.value
  initialY.value = currentY.value
})
</script>

<style lang="scss" scoped>
.simple-process-model-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none; // 禁用文本选择
}

.simple-process-model {
  position: relative; // 确保相对定位
  min-width: 100%; // 确保宽度为100%
  min-height: 100%; // 确保高度为100%
}

.z-index-button-group {
  z-index: 10;
}
</style>
