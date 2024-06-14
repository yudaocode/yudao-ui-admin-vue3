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
// 时间单位枚举
export enum TimeUnitType {
  /**
   * 分钟
   */
  MINUTE = 1,
  /**
   * 小时
   */
  HOUR = 2,
  /**
   * 天
   */
  DAY = 3
}

export enum RejectHandlerType {
  /**
   * 结束流程
   */
  FINISH_PROCESS = 1,
  /**
   * 驳回到指定节点
   */
  RETURN_PRE_USER_TASK = 2,
  /**
   * 按拒绝人数比例终止流程
   */
  FINISH_PROCESS_BY_REJECT_RATIO = 3,
   /**
   * 结束任务
   */
  FINISH_TASK = 4
  
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
// 多人审批方式类型 （ 用于审批节点 ）
export enum ApproveMethodType  {

  /**
  * 随机挑选一人审批
  */
  RRANDOM_SELECT_ONE_APPROVE = 1,

  /**
  * 多人会签(按通过比例)
  */
  APPROVE_BY_RATIO = 2,
  
  /**
  * 多人或签(通过只需一人，拒绝只需一人)
  */
  ANY_APPROVE = 3,
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
  { label: '随机挑选一人审批', value: ApproveMethodType.RRANDOM_SELECT_ONE_APPROVE },
  { label: '多人会签(按通过比例%)', value: ApproveMethodType.APPROVE_BY_RATIO },
  { label: '多人或签(一人通过或拒绝)', value: ApproveMethodType.ANY_APPROVE },
  { label: '依次审批(按顺序依次审批)', value: ApproveMethodType.SEQUENTIAL_APPROVE }
]

export const CONDITION_CONFIG_TYPES: DictDataVO [] = [
  { label: '条件表达式', value: 1 },
  { label: '条件规则', value: 2 }
]

// 时间单位类型
export const TIME_UNIT_TYPES: DictDataVO [] = [
  { label: '分钟', value: TimeUnitType.MINUTE },
  { label: '小时', value: TimeUnitType.HOUR },
  { label: '天', value: TimeUnitType.DAY },
]
// 超时处理执行动作类型
export const TIMEOUT_HANDLER_ACTION_TYPES: DictDataVO [] = [
  { label: '自动提醒', value: 1 },
  { label: '自动同意', value: 2 },
  { label: '自动拒绝', value: 3 },
]
export const REJECT_HANDLER_TYPES: DictDataVO [] = [
  { label: '终止流程', value: RejectHandlerType.FINISH_PROCESS },
  { label: '驳回到指定节点', value: RejectHandlerType.RETURN_PRE_USER_TASK },
  { label: '按拒绝人数终止流程(用于会签)', value: RejectHandlerType.FINISH_PROCESS_BY_REJECT_RATIO }
  // { label: '结束任务', value: RejectHandlerType.FINISH_TASK }
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
