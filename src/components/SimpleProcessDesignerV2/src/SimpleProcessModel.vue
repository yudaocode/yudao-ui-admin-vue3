<template>
  <div class="simple-process-model-container position-relative">
    <div class="position-absolute top-0px right-0px bg-#fff">
      <el-row type="flex" justify="end">
        <el-button-group key="scale-control" size="default">
          <el-button size="default" :icon="ScaleToOriginal" @click="processReZoom()" />
          <el-button size="default" :plain="true" :icon="ZoomOut" @click="zoomOut()" />
          <el-button size="default" class="w-80px"> {{ scaleValue }}% </el-button>
          <el-button size="default" :plain="true" :icon="ZoomIn" @click="zoomIn()" />
        </el-button-group>
        <el-button
          v-if="!readonly"
          size="default"
          class="ml-4px"
          type="primary"
          :icon="Select"
          @click="saveSimpleFlowModel"
          >保存模型</el-button
        >
      </el-row>
    </div>
    <div class="simple-process-model" :style="`transform: scale(${scaleValue / 100});`">
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
import { Select, ZoomOut, ZoomIn, ScaleToOriginal } from '@element-plus/icons-vue'
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
  'save': [node: SimpleFlowNode | undefined]
}>()

const processNodeTree = useWatchNode(props)

provide('readonly', props.readonly)
let scaleValue = ref(100)
const MAX_SCALE_VALUE = 200
const MIN_SCALE_VALUE = 50
// 放大
const zoomIn = () => {
  if (scaleValue.value == MAX_SCALE_VALUE) {
    return
  }
  scaleValue.value += 10
}
// 缩小
const zoomOut = () => {
  if (scaleValue.value == MIN_SCALE_VALUE) {
    return
  }
  scaleValue.value -= 10
}
const processReZoom = () => {
  scaleValue.value = 100
}

const errorDialogVisible = ref(false)
let errorNodes: SimpleFlowNode[] = []
const saveSimpleFlowModel = async () => {
  errorNodes = []
  validateNode(processNodeTree.value, errorNodes)
  if (errorNodes.length > 0) {
    errorDialogVisible.value = true
    return
  }
  emits('save', processNodeTree.value)
}
// 校验节点设置。 暂时以 showText 为空 未节点错误配置
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
</script>

<style lang="scss" scoped></style>
