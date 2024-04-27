<template>
  <div class="node-handler-wrapper">
    <div class="node-handler" v-if="props.showAdd">
     <el-popover  trigger="hover" v-model:visible="popoverShow"  placement="right-start"  width="auto"> 
          <div class="handler-item-wrapper">
            <div class="handler-item"  @click="addNode(NodeType.USER_TASK_NODE)">
              <div class="approve handler-item-icon">
                <span class="iconfont icon-approve icon-size"></span>
              </div>
              <div class="handler-item-text">审批人</div>
            </div>
            <div class="handler-item" @click="addNode(NodeType.COPY_TASK_NODE)">
              <div class="handler-item-icon copy">
                <span class="iconfont icon-size icon-copy"></span>
              </div>
              <div class="handler-item-text">抄送</div>
            </div>
          </div>
          <template #reference>
            <div class="add-icon"><Icon icon="ep:plus" /></div>
          </template>
      </el-popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SimpleFlowNode, NodeType, NODE_DEFAULT_NAME, CandidateStrategy } from './consts'
import { generateUUID } from '@/utils'
defineOptions({
  name: 'NodeHandler'
})
const popoverShow = ref(false)

const props = defineProps({
  childNode: {
    type: Object as () => SimpleFlowNode,
    default: null
  },
  showAdd: {
    // 是否显示添加节点
    type: Boolean,
    default: true
  }
})

const emits = defineEmits(['update:childNode'])

const addNode = (type: number) => {
  popoverShow.value = false
  if (type === NodeType.USER_TASK_NODE) {
    const data: SimpleFlowNode = {
      id:  generateUUID(),
      name: NODE_DEFAULT_NAME.get(NodeType.USER_TASK_NODE) as string,
      showText: '',
      type: NodeType.USER_TASK_NODE,
      // 审批节点配置
      attributes: {
        approveMethod: 1,
        candidateStrategy: CandidateStrategy.USER,
        candidateParam: undefined
      },
      childNode: props.childNode
    }
    emits('update:childNode', data)
  }
  if (type === NodeType.COPY_TASK_NODE) {
    const data: SimpleFlowNode = {
      id:  generateUUID(),
      name: NODE_DEFAULT_NAME.get(NodeType.COPY_TASK_NODE) as string,
      showText: '',
      type: NodeType.COPY_TASK_NODE,
      // 审批节点配置
      attributes: {
        candidateStrategy: CandidateStrategy.USER,
        candidateParam: undefined
      },
      childNode: props.childNode
    }
    emits('update:childNode', data)
  }
}
</script>

<style lang="scss" scoped></style>
