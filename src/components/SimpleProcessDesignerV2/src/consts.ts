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
   * 抄送人节点
   */
  COPY_TASK_NODE = 2,
 
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

// 条件配置类型 （ 用于条件节点配置 ）
export enum ConditionConfigType  {

   /**
   * 条件表达式
   */
  EXPRESSION = 1,

   /**
   * 条件规则
   */
  RULE = 2
}
// 审批方式类型 （ 用于审批节点 ）
export enum ApproveMethodType  {

  /**
  * 单人审批
  */
  SINGLE_PERSON_APPROVE = 1,

  /**
  * 多人会签(需所有审批人同意)
  */
  ALL_APPROVE = 2,
  /**
  * 多人或签(一名审批人同意即可)
  */
  ANY_OF_APPROVE = 3,
   /**
  * 多人依次审批
  */
  SEQUENTIAL_APPROVE = 4

}

// 候选人策略 （ 用于审批节点。抄送节点 )
export enum CandidateStrategy {
  /**
   * 指定角色
   */
  ROLE = 10,
  /**
   * 指定部门成员
   */
  DEPT_MEMBER = 20,
  /**
   * 部门的负责人
   */
  DEPT_LEADER = 21,
  /**
   * 指定岗位
   */
  POST = 22,
  /**
   * 指定用户
   */
  USER = 30,
  /**
   * 发起人自选
   */
  START_USER_SELECT = 35,
   /**
   * 发起人自己
   */
  START_USER = 36,
   /**
   * 指定用户组
   */
   USER_GROUP = 40,
   /**
   * 流程表达式
   */
   EXPRESSION = 60
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

// 条件组
export type ConditionGroup =  {
  // 条件组的逻辑关系是否为且
  and : boolean,
  // 条件数组
  conditions: Condition[]
}

// 条件
export type Condition = {
  // 条件规则的逻辑关系是否为且
  and : boolean,
  rules: ConditionRule[]
}

// 条件规则
export type ConditionRule = {
  type : number,
  opName: string,
  opCode: string,
  leftSide: string,
  rightSide: string
}


export const NODE_DEFAULT_TEXT = new Map<number,string>()
NODE_DEFAULT_TEXT.set(NodeType.USER_TASK_NODE, '请配置审批人')
NODE_DEFAULT_TEXT.set(NodeType.COPY_TASK_NODE, '请配置抄送人')
NODE_DEFAULT_TEXT.set(NodeType.CONDITION_NODE, '请设置条件')

export const NODE_DEFAULT_NAME = new Map<number,string>()
NODE_DEFAULT_NAME.set(NodeType.USER_TASK_NODE, '审批人')
NODE_DEFAULT_NAME.set(NodeType.COPY_TASK_NODE, '抄送人')
NODE_DEFAULT_NAME.set(NodeType.CONDITION_NODE, '条件')


export const APPROVE_METHODS: DictDataVO [] = [
  { label: '单人审批', value: 1 },
  { label: '多人会签(需所有审批人同意)', value: 2 },
  { label: '多人或签(一名审批人同意即可)', value: 3 },
  { label: '依次审批(按顺序依次审批)', value: 4 }
]

export const CONDITION_CONFIG_TYPES: DictDataVO [] = [
  { label: '条件表达式', value: 1 },
  { label: '条件规则', value: 2 }
]

// 比较运算符
export const COMPARISON_OPERATORS : DictDataVO = [
  {
    value: '==',
    label: '等于',
  },
  {
    value: '!=',
    label: '不等于',
  },
  {
    value: '>',
    label: '大于',
  },
  {
    value: '>=',
    label: '大于等于',
  },
  {
    value: '<',
    label: '小于',
  },
  {
    value: '<=',
    label: '小于等于',
  }
]
