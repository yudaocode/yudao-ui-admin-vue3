<template>
  <div class="simple-flow-canvas">
    <div class="simple-flow-container">
      <div class="top-area-container">
        <div class="top-actions">
          <div class="canvas-control">
            <span class="control-scale-group">
              <span class="control-scale-button"> <Icon icon="ep:plus" @click="zoomOut()" /></span>
              <span class="control-scale-label">{{ scaleValue }}%</span>
              <span class="control-scale-button"><Icon icon="ep:minus" @click="zoomIn()" /></span>
            </span>
          </div>
          <el-button type="primary" @click="saveSimpleFlowModel">保存</el-button>
          <!-- <el-button type="primary">全局设置</el-button> -->
        </div>
      </div>
      <div class="scale-container" :style="`transform: scale(${scaleValue / 100});`">
        <ProcessNodeTree v-if="processNodeTree"  v-model:flow-node="processNodeTree" />
      </div>
    </div>
    <Dialog v-model="errorDialogVisible" title="保存失败" width="400" :fullscreen="false">
      <div class="mb-2">以下节点内容不完善，请修改后保存</div>
      <div class="mb-3 b-rounded-1 bg-gray-100 p-2 line-height-normal" v-for="(item, index) in errorNodes" :key="index">
          {{ item.name }} : {{ NODE_DEFAULT_TEXT.get(item.type) }}
      </div>
      <template #footer>
        <el-button type="primary" @click="errorDialogVisible = false" >知道了</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import ProcessNodeTree from './ProcessNodeTree.vue';
import { saveBpmSimpleModel, getBpmSimpleModel } from '@/api/bpm/simple'
import { SimpleFlowNode, NodeType,NODE_DEFAULT_TEXT } from './consts'

defineOptions({
  name: 'SimpleProcessDesigner'
})

const router = useRouter() // 路由
const props = defineProps({
  modelId: String
})
const message = useMessage() // 国际化
const processNodeTree = ref<SimpleFlowNode>({
  name: '开始',
  type: NodeType.START_EVENT_NODE,
  id: 'StartEvent_1',
  childNode: {
    id: 'EndEvent_1',
    name: '结束',
    type: NodeType.END_EVENT_NODE
  }
})

// const rootNode = ref<SimpleFlowNode>({
//   name: '开始',
//   type: NodeType.START_EVENT_NODE,
//   id: 'StartEvent_1'
// })

// const childNode = ref<SimpleFlowNode>({
//   id: 'EndEvent_1',
//   name: '结束',
//   type: NodeType.END_EVENT_NODE
// })

const errorDialogVisible = ref(false)
let errorNodes: SimpleFlowNode[] = []
const saveSimpleFlowModel = async () => {
  console.log('processNodeTree===>', processNodeTree.value)
  if (!props.modelId) {
    message.error('缺少模型 modelId 编号')
    return
  }
  errorNodes = []
  validateNode(processNodeTree.value, errorNodes)
  if (errorNodes.length > 0) {
    errorDialogVisible.value = true
    return;
  }
  const data = {
    modelId: props.modelId,
    simpleModelBody: processNodeTree.value
  }

  const result = await saveBpmSimpleModel(data)
  if (result) {
    message.success('修改成功')
    close()
  } else {
    message.alert('修改失败')
  }
  
}
// 校验节点设置。 暂时以 showText 为空 未节点错误配置
const validateNode = (node: SimpleFlowNode | undefined, errorNodes: SimpleFlowNode[]) => {
  if (node) {
    const { type, showText, conditionNodes } = node
    if (type == NodeType.END_EVENT_NODE) {
      return
    }
    if (type == NodeType.START_EVENT_NODE) {
      validateNode(node.childNode, errorNodes)
    }

    if (type === NodeType.USER_TASK_NODE) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }
    if (type === NodeType.COPY_TASK_NODE) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }
    if (type === NodeType.CONDITION_NODE) {
      if (!showText) {
        errorNodes.push(node)
      }
      validateNode(node.childNode, errorNodes)
    }

    if (type == NodeType.EXCLUSIVE_NODE) {
      conditionNodes?.forEach((item) => {
        validateNode(item, errorNodes)
      })
      validateNode(node.childNode, errorNodes)
    }
  }
}

const close = () => {
  router.push({ path: '/bpm/manager/model' })
}
let scaleValue = ref(100)
const MAX_SCALE_VALUE = 200
const MIN_SCALE_VALUE = 50
// 放大
const zoomOut = () => {
  if (scaleValue.value == MAX_SCALE_VALUE) {
    return
  }
  scaleValue.value += 10
}
// 缩小
const zoomIn = () => {
  if (scaleValue.value == MIN_SCALE_VALUE) {
    return
  }
  scaleValue.value -= 10
}

onMounted(async () => {
  const result = await getBpmSimpleModel(props.modelId)
  if (result) {
    console.log('the result is ', result)
    processNodeTree.value = result
    // rootNode.value = result
    // childNode.value = result.childNode
  }
})
</script>
