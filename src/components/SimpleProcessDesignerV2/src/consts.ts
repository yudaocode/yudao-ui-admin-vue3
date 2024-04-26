// @ts-ignore
import { DictDataVO } from '@/api/system/dict/types'

export enum NodeType {
  /**
   * 发起人节点
   */
  START_EVENT_NODE = 0,
  /**
   * 结束节点
   */
  END_EVENT_NODE = -2,

  /**
   * 审批人节点
   */
  USER_TASK_NODE = 1,
 
  /**
   * 条件节点
   */
  CONDITION_NODE = 3,
  /**
   * 条件分支节点
   */
  EXCLUSIVE_NODE = 4,
  /**
   * 并行分支分叉节点
   */
  PARALLEL_NODE_FORK = 5,
  /**
   * 并行分支聚合
   */
  PARALLEL_NODE_JOIN = 6,
  /**
   * 包容分支分叉节点
   */
  INCLUSIVE_NODE_FORK = 7,
  /**
   * 包容分支聚合节点
   */
  INCLUSIVE_NODE_JOIN = 8
}

export type SimpleFlowNode = {
  id: string,
  type: NodeType,
  name: string,
  showText?: string,
  attributes?: any,
  // 孩子节点
  childNode?: SimpleFlowNode,
  // 条件节点
  conditionNodes?: SimpleFlowNode[]
}

export const NODE_DEFAULT_TEXT = new Map<number,string>()
NODE_DEFAULT_TEXT.set(NodeType.USER_TASK_NODE, '请配置该节点')
NODE_DEFAULT_TEXT.set(NodeType.CONDITION_NODE, '请设置条件')

export const NODE_DEFAULT_NAME = new Map<number,string>()
NODE_DEFAULT_NAME.set(NodeType.USER_TASK_NODE, '审批人')
NODE_DEFAULT_NAME.set(NodeType.CONDITION_NODE, '条件')


export const APPROVE_METHODS: DictDataVO [] = [
  { label: '单人审批', value: 1 },
  { label: '多人会签(需所有审批人同意)', value: 2 },
  { label: '多人或签(一名审批人同意即可)', value: 3 },
  { label: '依次审批(按顺序依次审批)', value: 4 }
  // TODO 更多的类型
]