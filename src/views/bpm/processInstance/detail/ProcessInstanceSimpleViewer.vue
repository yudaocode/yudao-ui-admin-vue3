<template>
  <div v-loading="loading" class="mb-20px">
      <SimpleProcessViewer :flow-node="simpleModel" :tasks="tasks" :process-instance="processInstance"/>
  </div>
</template>
<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { TaskStatusEnum } from '@/api/bpm/task'
import { SimpleFlowNode, NodeType } from '@/components/SimpleProcessDesignerV2/src/consts'
import { SimpleProcessViewer } from '@/components/SimpleProcessDesignerV2/src/'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'

defineOptions({ name: 'BpmProcessInstanceSimpleViewer' })

const props = defineProps({
  loading: propTypes.bool.def(false), // 是否加载中
  id: propTypes.string // 流程实例的编号
})
const simpleModel = ref()
// 用户任务
const tasks = ref([])
// 流程实例
const processInstance = ref()
/** 只有 loading 完成时，才去加载流程列表 */
watch(
  () => props.loading,
  async (value) => {
    if (value && props.id) {
      const modelView = await ProcessInstanceApi.getProcessInstanceBpmnModelView(props.id)
      if (modelView) {
        tasks.value = modelView.tasks
        processInstance.value = modelView.processInstance
        // 已经拒绝的活动节点编号集合，只包括 UserTask
        const rejectedTaskActivityIds: string[] = modelView.rejectedTaskActivityIds
        // 进行中的活动节点编号集合， 只包括 UserTask
        const unfinishedTaskActivityIds: string[] = modelView.unfinishedTaskActivityIds
        // 已经完成的活动节点编号集合， 包括 UserTask、Gateway 等
        const finishedActivityIds: string[] = modelView.finishedTaskActivityIds
        // 已经完成的连线节点编号集合，只包括 SequenceFlow
        const finishedSequenceFlowActivityIds: string[] = modelView.finishedSequenceFlowActivityIds
        setSimpleModelNodeTaskStatus(
          modelView.simpleModel,
          modelView.processInstance.status,
          rejectedTaskActivityIds,
          unfinishedTaskActivityIds,
          finishedActivityIds,
          finishedSequenceFlowActivityIds
        )
        simpleModel.value = modelView.simpleModel
      }
    }
  }
)

const setSimpleModelNodeTaskStatus = (
  simpleModel: SimpleFlowNode | undefined,
  processStatus: number,
  rejectedTaskActivityIds: string[],
  unfinishedTaskActivityIds: string[],
  finishedActivityIds: string[],
  finishedSequenceFlowActivityIds: string[]
) => {
  if (!simpleModel) {
    return
  }
  // 结束节点
  if (simpleModel.type === NodeType.END_EVENT_NODE) {
    if (finishedActivityIds.includes(simpleModel.id)) {
      simpleModel.activityStatus = processStatus
    } else {
      simpleModel.activityStatus = TaskStatusEnum.NOT_START
    }
    return
  }

  // 审批节点
  if (
    simpleModel.type === NodeType.START_USER_NODE ||
    simpleModel.type === NodeType.USER_TASK_NODE
  ) {
    simpleModel.activityStatus = TaskStatusEnum.NOT_START
    if (rejectedTaskActivityIds.includes(simpleModel.id)) {
      simpleModel.activityStatus = TaskStatusEnum.REJECT
    } else if (unfinishedTaskActivityIds.includes(simpleModel.id)) {
      simpleModel.activityStatus = TaskStatusEnum.RUNNING
    } else if (finishedActivityIds.includes(simpleModel.id)) {
      simpleModel.activityStatus = TaskStatusEnum.APPROVE
    }
    // TODO 是不是还缺一个 cancel 的状态
  }

  // 抄送节点
  if (simpleModel.type === NodeType.COPY_TASK_NODE) {
    // 抄送节点 只有通过和未执行状态
    if (finishedActivityIds.includes(simpleModel.id)) {
      simpleModel.activityStatus = TaskStatusEnum.APPROVE
    } else {
      simpleModel.activityStatus = TaskStatusEnum.NOT_START
    }
  }
  // 条件节点 对应 SequenceFlow
  if (simpleModel.type === NodeType.CONDITION_NODE) {
    // 条件节点。只有通过和未执行状态
    if (finishedSequenceFlowActivityIds.includes(simpleModel.id)) {
      simpleModel.activityStatus = TaskStatusEnum.APPROVE
    } else {
      simpleModel.activityStatus = TaskStatusEnum.NOT_START
    }
  }

  // 网关节点
  if (
    simpleModel.type === NodeType.CONDITION_BRANCH_NODE ||
    simpleModel.type === NodeType.PARALLEL_BRANCH_NODE ||
    simpleModel.type === NodeType.INCLUSIVE_BRANCH_NODE
  ) {
    // 网关节点。只有通过和未执行状态
    if (finishedActivityIds.includes(simpleModel.id)) {
      simpleModel.activityStatus = TaskStatusEnum.APPROVE
    } else {
      simpleModel.activityStatus = TaskStatusEnum.NOT_START
    }
    simpleModel.conditionNodes?.forEach((node) => {
      setSimpleModelNodeTaskStatus(
        node,
        processStatus,
        rejectedTaskActivityIds,
        unfinishedTaskActivityIds,
        finishedActivityIds,
        finishedSequenceFlowActivityIds
      )
    })
  }

  setSimpleModelNodeTaskStatus(
    simpleModel.childNode,
    processStatus,
    rejectedTaskActivityIds,
    unfinishedTaskActivityIds,
    finishedActivityIds,
    finishedSequenceFlowActivityIds
  )
}
</script>
