<template>
  <div class="node-handler-wrapper">
    <div class="node-handler" v-if="props.showAdd">
      <el-popover
        trigger="hover"
        v-model:visible="popoverShow"
        placement="right-start"
        width="auto"
      >
        <div class="handler-item-wrapper">
          <div class="handler-item" @click="addNode(NodeType.USER_TASK_NODE)">
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
          <div class="handler-item" @click="addNode(NodeType.CONDITION_BRANCH_NODE)">
            <div class="handler-item-icon condition">
              <span class="iconfont icon-size icon-exclusive"></span>
            </div>
            <div class="handler-item-text">条件分支</div>
          </div>
          <div class="handler-item" @click="addNode(NodeType.PARALLEL_BRANCH_NODE)">
            <div class="handler-item-icon condition">
              <span class="iconfont icon-size icon-parallel"></span>
            </div>
            <div class="handler-item-text">并行分支</div>
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
import {
  ApproveMethodType,
  AssignEmptyHandlerType,
  AssignStartUserHandlerType,
  NODE_DEFAULT_NAME,
  NodeType,
  RejectHandlerType,
  SimpleFlowNode
} from './consts'
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
    const id = 'Activity_' + generateUUID()
    const data: SimpleFlowNode = {
      id: id,
      name: NODE_DEFAULT_NAME.get(NodeType.USER_TASK_NODE) as string,
      showText: '',
      type: NodeType.USER_TASK_NODE,
      approveMethod: ApproveMethodType.SEQUENTIAL_APPROVE,
      // 超时处理
      rejectHandler: {
        type: RejectHandlerType.FINISH_PROCESS
      },
      timeoutHandler: {
        enable: false
      },
      assignEmptyHandler: {
        type: AssignEmptyHandlerType.APPROVE
      },
      assignStartUserHandlerType: AssignStartUserHandlerType.START_USER_AUDIT,
      childNode: props.childNode
    }
    emits('update:childNode', data)
  }
  if (type === NodeType.COPY_TASK_NODE) {
    const data: SimpleFlowNode = {
      id: 'Activity_' + generateUUID(),
      name: NODE_DEFAULT_NAME.get(NodeType.COPY_TASK_NODE) as string,
      showText: '',
      type: NodeType.COPY_TASK_NODE,
      childNode: props.childNode
    }
    emits('update:childNode', data)
  }
  if (type === NodeType.CONDITION_BRANCH_NODE) {
    const data: SimpleFlowNode = {
      name: '条件分支',
      type: NodeType.CONDITION_BRANCH_NODE,
      id: 'GateWay_' + generateUUID(),
      childNode: props.childNode,
      conditionNodes: [
        {
          id: 'Flow_' + generateUUID(),
          name: '条件1',
          showText: '',
          type: NodeType.CONDITION_NODE,
          childNode: undefined,
          conditionType: 1,
          defaultFlow: false
          
        },
        {
          id: 'Flow_' + generateUUID(),
          name: '其它情况',
          showText: '其它情况进入此流程',
          type: NodeType.CONDITION_NODE,
          childNode: undefined,
          conditionType: undefined,
          defaultFlow: true
        }
      ]
    }
    emits('update:childNode', data)
  }
  if (type === NodeType.PARALLEL_BRANCH_NODE) {
    const data: SimpleFlowNode = {
      name: '并行分支',
      type: NodeType.PARALLEL_BRANCH_NODE,
      id: 'GateWay_' + generateUUID(),
      childNode: props.childNode,
      conditionNodes: [
        {
          id: 'Flow_' + generateUUID(),
          name: '并行1',
          showText: '无需配置条件同时执行',
          type: NodeType.CONDITION_NODE,
          childNode: undefined
        },
        {
          id: 'Flow_' + generateUUID(),
          name: '并行2',
          showText: '无需配置条件同时执行',
          type: NodeType.CONDITION_NODE,
          childNode: undefined
        }
      ]
    }
    emits('update:childNode', data)
  }
}
</script>

<style lang="scss" scoped></style>
