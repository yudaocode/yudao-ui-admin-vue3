export enum NodeType {
  //// -1 根节点流程开始节点 0 发起人 1审批 2抄送 3条件 4路由
  ROOT_NODE = -1,
  /**
   * 发起人节点
   */
  START_USER_NODE = 0,
  /**
   * 审批人节点
   */
  APPROVE_USER_NODE = 1,
  /**
   * 抄送人节点
   */
  CC_USER_NODE = 2,
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

export const NODE_BG_COLOR = new Map()
NODE_BG_COLOR.set(NodeType.START_USER_NODE, '#87, 106, 149')
NODE_BG_COLOR.set(NodeType.APPROVE_USER_NODE, '#255, 148, 62')
NODE_BG_COLOR.set(NodeType.CC_USER_NODE, '#50, 150, 250')

/**
 * 节点的标题
 */
export const NODE_TITLE = new Map()
NODE_TITLE.set(NodeType.START_USER_NODE, '发起人')
NODE_TITLE.set(NodeType.APPROVE_USER_NODE, '审批人')
NODE_TITLE.set(NodeType.CC_USER_NODE, '抄送人')

export type WorkFlowNode = {
  id: string,
  type: NodeType,
  name: string,
  attributes: any,
  // 操作人
  childNode?: WorkFlowNode | undefined,
  conditionNodes: WorkFlowNode[]
}