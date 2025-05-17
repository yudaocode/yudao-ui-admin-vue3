// @ts-ignore
import { DictDataVO } from '@/api/system/dict/types'
import { TaskStatusEnum } from '@/api/bpm/task'
/**
 * 节点类型
 */
export enum NodeType {
  /**
   * 结束节点
   */
  END_EVENT_NODE = 1,
  /**
   * 发起人节点
   */
  START_USER_NODE = 10,
  /**
   * 审批人节点
   */
  USER_TASK_NODE = 11,

  /**
   * 抄送人节点
   */
  COPY_TASK_NODE = 12,

  /**
   * 办理人节点
   */
  TRANSACTOR_NODE = 13,

  /**
   * 延迟器节点
   */
  DELAY_TIMER_NODE = 14,

  /**
   * 触发器节点
   */
  TRIGGER_NODE = 15,

  /**
   * 子流程节点
   */
  CHILD_PROCESS_NODE = 20,

  /**
   * 条件节点
   */
  CONDITION_NODE = 50,
  /**
   * 条件分支节点 (对应排他网关)
   */
  CONDITION_BRANCH_NODE = 51,
  /**
   * 并行分支节点 (对应并行网关)
   */
  PARALLEL_BRANCH_NODE = 52,

  /**
   * 包容分支节点 (对应包容网关)
   */
  INCLUSIVE_BRANCH_NODE = 53,
  /**
   * 路由分支节点
   */
  ROUTER_BRANCH_NODE = 54
}

export enum NodeId {
  /**
   * 发起人节点 Id
   */
  START_USER_NODE_ID = 'StartUserNode',

  /**
   * 发起人节点 Id
   */
  END_EVENT_NODE_ID = 'EndEvent'
}

/**
 *  节点结构定义
 */
export interface SimpleFlowNode {
  id: string
  type: NodeType
  name: string
  showText?: string
  // 孩子节点
  childNode?: SimpleFlowNode
  // 条件节点
  conditionNodes?: SimpleFlowNode[]
  // 审批类型
  approveType?: ApproveType
  // 候选人策略
  candidateStrategy?: number
  // 候选人参数
  candidateParam?: string
  // 多人审批方式
  approveMethod?: ApproveMethodType
  //通过比例
  approveRatio?: number
  // 审批按钮设置
  buttonsSetting?: any[]
  // 表单权限
  fieldsPermission?: Array<Record<string, any>>
  // 审批任务超时处理
  timeoutHandler?: TimeoutHandler
  // 审批任务拒绝处理
  rejectHandler?: RejectHandler
  // 审批人为空的处理
  assignEmptyHandler?: AssignEmptyHandler
  // 审批节点的审批人与发起人相同时，对应的处理类型
  assignStartUserHandlerType?: number
  // 创建任务监听器
  taskCreateListener?: ListenerHandler
  // 创建任务监听器
  taskAssignListener?: ListenerHandler
  // 创建任务监听器
  taskCompleteListener?: ListenerHandler
  // 条件设置
  conditionSetting?: ConditionSetting
  // 活动的状态，用于前端节点状态展示
  activityStatus?: TaskStatusEnum
  // 延迟设置
  delaySetting?: DelaySetting
  // 路由分支
  routerGroups?: RouterSetting[]
  defaultFlowId?: string
  // 签名
  signEnable?: boolean
  // 审批意见
  reasonRequire?: boolean
  // 触发器设置
  triggerSetting?: TriggerSetting
  // 子流程
  childProcessSetting?: ChildProcessSetting
}
// 候选人策略枚举 （ 用于审批节点。抄送节点 )
export enum CandidateStrategy {
  /**
   * 指定角色
   */
  ROLE = 10,
  /**
   * 部门成员
   */
  DEPT_MEMBER = 20,
  /**
   * 部门的负责人
   */
  DEPT_LEADER = 21,
  /**
   * 连续多级部门的负责人
   */
  MULTI_LEVEL_DEPT_LEADER = 23,
  /**
   * 指定岗位
   */
  POST = 22,
  /**
   * 指定用户
   */
  USER = 30,
  /**
   * 审批人自选
   */
  APPROVE_USER_SELECT = 34,
  /**
   * 发起人自选
   */
  START_USER_SELECT = 35,
  /**
   * 发起人自己
   */
  START_USER = 36,
  /**
   * 发起人部门负责人
   */
  START_USER_DEPT_LEADER = 37,
  /**
   * 发起人连续多级部门的负责人
   */
  START_USER_MULTI_LEVEL_DEPT_LEADER = 38,
  /**
   * 指定用户组
   */
  USER_GROUP = 40,
  /**
   * 表单内用户字段
   */
  FORM_USER = 50,
  /**
   * 表单内部门负责人
   */
  FORM_DEPT_LEADER = 51,
  /**
   * 流程表达式
   */
  EXPRESSION = 60
}

// 多人审批方式类型枚举 （ 用于审批节点 ）
export enum ApproveMethodType {
  /**
   * 随机挑选一人审批
   */
  RANDOM_SELECT_ONE_APPROVE = 1,

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

/**
 * 审批拒绝结构定义
 */
export type RejectHandler = {
  // 审批拒绝类型
  type: RejectHandlerType
  // 退回节点 Id
  returnNodeId?: string
}

/**
 * 审批超时结构定义
 */
export type TimeoutHandler = {
  // 是否开启超时处理
  enable: boolean
  // 超时执行的动作
  type?: number
  // 超时时间设置
  timeDuration?: string
  // 执行动作是自动提醒, 最大提醒次数
  maxRemindCount?: number
}

/**
 * 审批人为空的结构定义
 */
export type AssignEmptyHandler = {
  // 审批人为空的处理类型
  type: AssignEmptyHandlerType
  // 指定用户的编号数组
  userIds?: number[]
}

/**
 * 监听器的结构定义
 */
export type ListenerHandler = {
  enable: boolean
  path?: string
  header?: HttpRequestParam[]
  body?: HttpRequestParam[]
}
export type HttpRequestParam = {
  key: string
  type: number
  value: string
}
export enum BpmHttpRequestParamTypeEnum {
  /**
   * 固定值
   */
  FIXED_VALUE = 1,
  /**
   * 表单
   */
  FROM_FORM = 2
}
export const BPM_HTTP_REQUEST_PARAM_TYPES = [
  {
    value: 1,
    label: '固定值'
  },
  {
    value: 2,
    label: '表单'
  }
]

// 审批拒绝类型枚举
export enum RejectHandlerType {
  /**
   * 结束流程
   */
  FINISH_PROCESS = 1,
  /**
   * 驳回到指定节点
   */
  RETURN_USER_TASK = 2
}
// 用户任务超时处理类型枚举
export enum TimeoutHandlerType {
  /**
   * 自动提醒
   */
  REMINDER = 1,
  /**
   * 自动同意
   */
  APPROVE = 2,
  /**
   * 自动拒绝
   */
  REJECT = 3
}
// 用户任务的审批人为空时，处理类型枚举
export enum AssignEmptyHandlerType {
  /**
   * 自动通过
   */
  APPROVE = 1,
  /**
   * 自动拒绝
   */
  REJECT = 2,
  /**
   * 指定人员审批
   */
  ASSIGN_USER,
  /**
   * 转交给流程管理员
   */
  ASSIGN_ADMIN = 4
}
// 用户任务的审批人与发起人相同时，处理类型枚举
export enum AssignStartUserHandlerType {
  /**
   * 由发起人对自己审批
   */
  START_USER_AUDIT = 1,
  /**
   * 自动跳过【参考飞书】：1）如果当前节点还有其他审批人，则交由其他审批人进行审批；2）如果当前节点没有其他审批人，则该节点自动通过
   */
  SKIP = 2,
  /**
   * 转交给部门负责人审批
   */
  ASSIGN_DEPT_LEADER = 3
}

// 用户任务的审批类型。 【参考飞书】
export enum ApproveType {
  /**
   * 人工审批
   */
  USER = 1,
  /**
   * 自动通过
   */
  AUTO_APPROVE = 2,
  /**
   * 自动拒绝
   */
  AUTO_REJECT = 3
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

/**
 * 条件节点设置结构定义，用于条件节点
 */
export type ConditionSetting = {
  // 条件类型
  conditionType?: ConditionType
  // 条件表达式
  conditionExpression?: string
  // 条件组
  conditionGroups?: ConditionGroup
  // 是否默认的条件
  defaultFlow?: boolean
}

// 条件配置类型 （ 用于条件节点配置 ）
export enum ConditionType {
  /**
   * 条件表达式
   */
  EXPRESSION = 1,

  /**
   * 条件规则
   */
  RULE = 2
}
/**
 * 表单权限的枚举
 */
export enum FieldPermissionType {
  /**
   * 只读
   */
  READ = '1',
  /**
   * 编辑
   */
  WRITE = '2',
  /**
   * 隐藏
   */
  NONE = '3'
}
/**
 * 操作按钮权限结构定义
 */
export type ButtonSetting = {
  id: OperationButtonType
  displayName: string
  enable: boolean
}

// 操作按钮类型枚举 (用于审批节点)
export enum OperationButtonType {
  /**
   * 通过
   */
  APPROVE = 1,
  /**
   * 拒绝
   */
  REJECT = 2,
  /**
   * 转办
   */
  TRANSFER = 3,
  /**
   * 委派
   */
  DELEGATE = 4,
  /**
   * 加签
   */
  ADD_SIGN = 5,
  /**
   * 退回
   */
  RETURN = 6,
  /**
   * 抄送
   */
  COPY = 7
}

/**
 * 条件规则结构定义
 */
export type ConditionRule = {
  opCode: string
  leftSide: string
  rightSide: string
}

/**
 * 条件组结构定义
 */
export type ConditionGroup = {
  // 条件组的逻辑关系是否为且
  and: boolean
  // 条件数组
  conditions: Condition[]
}
/**
 * 条件组默认值
 */
export const DEFAULT_CONDITION_GROUP_VALUE = {
  and: true,
  conditions: [
    {
      and: true,
      rules: [
        {
          opCode: '==',
          leftSide: '',
          rightSide: ''
        }
      ]
    }
  ]
}

/**
 * 条件结构定义
 */
export type Condition = {
  // 条件规则的逻辑关系是否为且
  and: boolean
  rules: ConditionRule[]
}

export const NODE_DEFAULT_TEXT = new Map<number, string>()
NODE_DEFAULT_TEXT.set(NodeType.USER_TASK_NODE, 'Please configure approver')
NODE_DEFAULT_TEXT.set(NodeType.COPY_TASK_NODE, 'Please configure CC user')
NODE_DEFAULT_TEXT.set(NodeType.CONDITION_NODE, 'Please set condition')
NODE_DEFAULT_TEXT.set(NodeType.START_USER_NODE, 'Please set initiator')
NODE_DEFAULT_TEXT.set(NodeType.DELAY_TIMER_NODE, 'Please set timer')
NODE_DEFAULT_TEXT.set(NodeType.ROUTER_BRANCH_NODE, 'Please set router node')
NODE_DEFAULT_TEXT.set(NodeType.TRIGGER_NODE, 'Please set trigger')
NODE_DEFAULT_TEXT.set(NodeType.TRANSACTOR_NODE, 'Please set transactor')
NODE_DEFAULT_TEXT.set(NodeType.CHILD_PROCESS_NODE, 'Please set sub-process')

export const NODE_DEFAULT_NAME = new Map<number, string>()
NODE_DEFAULT_NAME.set(NodeType.USER_TASK_NODE, 'Approver')
NODE_DEFAULT_NAME.set(NodeType.COPY_TASK_NODE, 'CC User')
NODE_DEFAULT_NAME.set(NodeType.CONDITION_NODE, 'Condition')
NODE_DEFAULT_NAME.set(NodeType.START_USER_NODE, 'Initiator')
NODE_DEFAULT_NAME.set(NodeType.DELAY_TIMER_NODE, 'Timer')
NODE_DEFAULT_NAME.set(NodeType.ROUTER_BRANCH_NODE, 'Router Branch')
NODE_DEFAULT_NAME.set(NodeType.TRIGGER_NODE, 'Trigger')
NODE_DEFAULT_NAME.set(NodeType.TRANSACTOR_NODE, 'Transactor')
NODE_DEFAULT_NAME.set(NodeType.CHILD_PROCESS_NODE, 'Sub-process')

// 候选人策略。暂时不从字典中取。 后续可能调整。控制显示顺序
export const CANDIDATE_STRATEGY: DictDataVO[] = [
  { label: 'Specify User', value: CandidateStrategy.USER },
  { label: 'Specify Role', value: CandidateStrategy.ROLE },
  { label: 'Specify Post', value: CandidateStrategy.POST },
  { label: 'Department Member', value: CandidateStrategy.DEPT_MEMBER },
  { label: 'Department Leader', value: CandidateStrategy.DEPT_LEADER },
  { label: 'Multi-level Department Leader', value: CandidateStrategy.MULTI_LEVEL_DEPT_LEADER },
  { label: 'Initiator Select', value: CandidateStrategy.START_USER_SELECT },
  { label: 'Approver Select', value: CandidateStrategy.APPROVE_USER_SELECT },
  { label: 'Initiator', value: CandidateStrategy.START_USER },
  { label: 'Initiator Department Leader', value: CandidateStrategy.START_USER_DEPT_LEADER },
  { label: 'Initiator Multi-level Department Leader', value: CandidateStrategy.START_USER_MULTI_LEVEL_DEPT_LEADER },
  { label: 'User Group', value: CandidateStrategy.USER_GROUP },
  { label: 'Form User Field', value: CandidateStrategy.FORM_USER },
  { label: 'Form Department Leader', value: CandidateStrategy.FORM_DEPT_LEADER },
  { label: 'Process Expression', value: CandidateStrategy.EXPRESSION }
]
// 审批节点 的审批类型
export const APPROVE_TYPE: DictDataVO[] = [
  { label: 'Manual Approval', value: ApproveType.USER },
  { label: 'Auto Approve', value: ApproveType.AUTO_APPROVE },
  { label: 'Auto Reject', value: ApproveType.AUTO_REJECT }
]

export const APPROVE_METHODS: DictDataVO[] = [
  { label: 'Sequential Approval', value: ApproveMethodType.SEQUENTIAL_APPROVE },
  { label: 'Countersign (at least % must approve)', value: ApproveMethodType.APPROVE_BY_RATIO },
  { label: 'Or-sign (anyone can approve)', value: ApproveMethodType.ANY_APPROVE },
  { label: 'Randomly Select One to Approve', value: ApproveMethodType.RANDOM_SELECT_ONE_APPROVE }
]

export const CONDITION_CONFIG_TYPES: DictDataVO[] = [
  { label: 'Condition Rule', value: ConditionType.RULE },
  { label: 'Condition Expression', value: ConditionType.EXPRESSION }
]

// 时间单位类型
export const TIME_UNIT_TYPES: DictDataVO[] = [
  { label: 'Minute', value: TimeUnitType.MINUTE },
  { label: 'Hour', value: TimeUnitType.HOUR },
  { label: 'Day', value: TimeUnitType.DAY }
]
// 超时处理执行动作类型
export const TIMEOUT_HANDLER_TYPES: DictDataVO[] = [
  { label: 'Auto Reminder', value: 1 },
  { label: 'Auto Approve', value: 2 },
  { label: 'Auto Reject', value: 3 }
]
export const REJECT_HANDLER_TYPES: DictDataVO[] = [
  { label: 'Terminate Process', value: RejectHandlerType.FINISH_PROCESS },
  { label: 'Reject to Specified Node', value: RejectHandlerType.RETURN_USER_TASK }
]
export const ASSIGN_EMPTY_HANDLER_TYPES: DictDataVO[] = [
  { label: 'Auto Approve', value: 1 },
  { label: 'Auto Reject', value: 2 },
  { label: 'Specify User Approval', value: 3 },
  { label: 'Transfer to Process Admin', value: 4 }
]
export const ASSIGN_START_USER_HANDLER_TYPES: DictDataVO[] = [
  { label: 'Initiator Approves Self', value: 1 },
  { label: 'Auto Skip', value: 2 },
  { label: 'Transfer to Department Leader', value: 3 }
]

// 比较运算符
export const COMPARISON_OPERATORS: DictDataVO = [
  {
    value: '==',
    label: 'Equals'
  },
  {
    value: '!=',
    label: 'Not Equals'
  },
  {
    value: '>',
    label: 'Greater'
  },
  {
    value: '>=',
    label: 'Greater or Equal'
  },
  {
    value: '<',
    label: 'Less'
  },
  {
    value: '<=',
    label: 'Less or Equal'
  }
]
// 审批操作按钮名称
export const OPERATION_BUTTON_NAME = new Map<number, string>()
OPERATION_BUTTON_NAME.set(OperationButtonType.APPROVE, 'Approve')
OPERATION_BUTTON_NAME.set(OperationButtonType.REJECT, 'Reject')
OPERATION_BUTTON_NAME.set(OperationButtonType.TRANSFER, 'Transfer')
OPERATION_BUTTON_NAME.set(OperationButtonType.DELEGATE, 'Delegate')
OPERATION_BUTTON_NAME.set(OperationButtonType.ADD_SIGN, 'Add Sign')
OPERATION_BUTTON_NAME.set(OperationButtonType.RETURN, 'Return')
OPERATION_BUTTON_NAME.set(OperationButtonType.COPY, 'CC')

// 默认的按钮权限设置
export const DEFAULT_BUTTON_SETTING: ButtonSetting[] = [
  { id: OperationButtonType.APPROVE, displayName: 'Approve', enable: true },
  { id: OperationButtonType.REJECT, displayName: 'Reject', enable: true },
  { id: OperationButtonType.TRANSFER, displayName: 'Transfer', enable: true },
  { id: OperationButtonType.DELEGATE, displayName: 'Delegate', enable: true },
  { id: OperationButtonType.ADD_SIGN, displayName: 'Add Sign', enable: true },
  { id: OperationButtonType.RETURN, displayName: 'Return', enable: true }
]

// 办理人默认的按钮权限设置
export const TRANSACTOR_DEFAULT_BUTTON_SETTING: ButtonSetting[] = [
  { id: OperationButtonType.APPROVE, displayName: 'Process', enable: true },
  { id: OperationButtonType.REJECT, displayName: 'Reject', enable: false },
  { id: OperationButtonType.TRANSFER, displayName: 'Transfer', enable: false },
  { id: OperationButtonType.DELEGATE, displayName: 'Delegate', enable: false },
  { id: OperationButtonType.ADD_SIGN, displayName: 'Add Sign', enable: false },
  { id: OperationButtonType.RETURN, displayName: 'Return', enable: false }
]

// 发起人的按钮权限。暂时定死，不可以编辑
export const START_USER_BUTTON_SETTING: ButtonSetting[] = [
  { id: OperationButtonType.APPROVE, displayName: 'Submit', enable: true },
  { id: OperationButtonType.REJECT, displayName: 'Reject', enable: false },
  { id: OperationButtonType.TRANSFER, displayName: 'Transfer', enable: false },
  { id: OperationButtonType.DELEGATE, displayName: 'Delegate', enable: false },
  { id: OperationButtonType.ADD_SIGN, displayName: 'Add Sign', enable: false },
  { id: OperationButtonType.RETURN, displayName: 'Return', enable: false }
]

export const MULTI_LEVEL_DEPT: DictDataVO = [
  { label: 'Level 1 Department', value: 1 },
  { label: 'Level 2 Department', value: 2 },
  { label: 'Level 3 Department', value: 3 },
  { label: 'Level 4 Department', value: 4 },
  { label: 'Level 5 Department', value: 5 },
  { label: 'Level 6 Department', value: 6 },
  { label: 'Level 7 Department', value: 7 },
  { label: 'Level 8 Department', value: 8 },
  { label: 'Level 9 Department', value: 9 },
  { label: 'Level 10 Department', value: 10 },
  { label: 'Level 11 Department', value: 11 },
  { label: 'Level 12 Department', value: 12 },
  { label: 'Level 13 Department', value: 13 },
  { label: 'Level 14 Department', value: 14 },
  { label: 'Level 15 Department', value: 15 }
]

/**
 * 流程实例的变量枚举
 */
export enum ProcessVariableEnum {
  /**
   * 发起用户 ID
   */
  START_USER_ID = 'PROCESS_START_USER_ID',
  /**
   * 发起时间
   */
  START_TIME = 'PROCESS_START_TIME',
  /**
   * 流程定义名称
   */
  PROCESS_DEFINITION_NAME = 'PROCESS_DEFINITION_NAME'
}

/**
 * 延迟设置
 */
export type DelaySetting = {
  // 延迟类型
  delayType: number
  // 延迟时间表达式
  delayTime: string
}
/**
 * 延迟类型
 */
export enum DelayTypeEnum {
  /**
   * 固定时长
   */
  FIXED_TIME_DURATION = 1,
  /**
   * 固定日期时间
   */
  FIXED_DATE_TIME = 2
}

export const DELAY_TYPE = [
  { label: 'Fixed Duration', value: DelayTypeEnum.FIXED_TIME_DURATION },
  { label: 'Fixed Date', value: DelayTypeEnum.FIXED_DATE_TIME }
]

/**
 * 路由分支结构定义
 */
export type RouterSetting = {
  nodeId: string
  conditionType: ConditionType
  conditionExpression: string
  conditionGroups: ConditionGroup
}

// ==================== 触发器相关定义 ====================
/**
 * 触发器节点结构定义
 */
export type TriggerSetting = {
  type: TriggerTypeEnum
  httpRequestSetting?: HttpRequestTriggerSetting
  formSettings?: FormTriggerSetting[]
}

/**
 * 触发器类型枚举
 */
export enum TriggerTypeEnum {
  /**
   * 发送 HTTP 请求触发器
   */
  HTTP_REQUEST = 1,
  /**
   * 接收 HTTP 回调请求触发器
   */
  HTTP_CALLBACK = 2,
  /**
   * 表单数据更新触发器
   */
  FORM_UPDATE = 10,
  /**
   * 表单数据删除触发器
   */
  FORM_DELETE = 11
}

/**
 * HTTP 请求触发器结构定义
 */
export type HttpRequestTriggerSetting = {
  // 请求 URL
  url: string
  // 请求头参数设置
  header?: HttpRequestParam[]
  // 请求体参数设置
  body?: HttpRequestParam[]
  // 请求响应设置
  response?: Record<string, string>[]
}

/**
 * 流程表单触发器配置结构定义
 */
export type FormTriggerSetting = {
  // 条件类型
  conditionType?: ConditionType
  // 条件表达式
  conditionExpression?: string
  // 条件组
  conditionGroups?: ConditionGroup
  // 更新表单字段配置
  updateFormFields?: Record<string, any>
  // 删除表单字段配置
  deleteFields?: string[]
}

export const TRIGGER_TYPES: DictDataVO[] = [
  { label: 'Send HTTP Request', value: TriggerTypeEnum.HTTP_REQUEST },
  { label: 'Receive HTTP Callback', value: TriggerTypeEnum.HTTP_CALLBACK },
  { label: 'Update Form Data', value: TriggerTypeEnum.FORM_UPDATE },
  { label: 'Delete Form Data', value: TriggerTypeEnum.FORM_DELETE }
]

/**
 * 子流程节点结构定义
 */
export type ChildProcessSetting = {
  calledProcessDefinitionKey: string
  calledProcessDefinitionName: string
  async: boolean
  inVariables?: IOParameter[]
  outVariables?: IOParameter[]
  skipStartUserNode: boolean
  startUserSetting: StartUserSetting
  timeoutSetting: TimeoutSetting
  multiInstanceSetting: MultiInstanceSetting
}
export type IOParameter = {
  source: string
  target: string
}
export type StartUserSetting = {
  type: ChildProcessStartUserTypeEnum
  formField?: string
  emptyType?: ChildProcessStartUserEmptyTypeEnum
}
export type TimeoutSetting = {
  enable: boolean
  type?: DelayTypeEnum
  timeExpression?: string
}
export type MultiInstanceSetting = {
  enable: boolean
  sequential?: boolean
  approveRatio?: number
  sourceType?: ChildProcessMultiInstanceSourceTypeEnum
  source?: string
}
export enum ChildProcessStartUserTypeEnum {
  /**
   * 同主流程发起人
   */
  MAIN_PROCESS_START_USER = 1,
  /**
   * 表单
   */
  FROM_FORM = 2
}
export const CHILD_PROCESS_START_USER_TYPE = [
  { label: 'Same as Main Process Initiator', value: ChildProcessStartUserTypeEnum.MAIN_PROCESS_START_USER },
  { label: 'Form', value: ChildProcessStartUserTypeEnum.FROM_FORM }
]
export enum ChildProcessStartUserEmptyTypeEnum {
  /**
   * 同主流程发起人
   */
  MAIN_PROCESS_START_USER = 1,
  /**
   * 子流程管理员
   */
  CHILD_PROCESS_ADMIN = 2,
  /**
   * 主流程管理员
   */
  MAIN_PROCESS_ADMIN = 3
}
export const CHILD_PROCESS_START_USER_EMPTY_TYPE = [
  { label: 'Same as Main Process Initiator', value: ChildProcessStartUserEmptyTypeEnum.MAIN_PROCESS_START_USER },
  { label: 'Sub-process Admin', value: ChildProcessStartUserEmptyTypeEnum.CHILD_PROCESS_ADMIN },
  { label: 'Main Process Admin', value: ChildProcessStartUserEmptyTypeEnum.MAIN_PROCESS_ADMIN }
]
export enum ChildProcessMultiInstanceSourceTypeEnum {
  /**
   * 固定数量
   */
  FIXED_QUANTITY = 1,
  /**
   * 数字表单
   */
  NUMBER_FORM = 2,
  /**
   * 多选表单
   */
  MULTIPLE_FORM = 3
}
export const CHILD_PROCESS_MULTI_INSTANCE_SOURCE_TYPE = [
  { label: 'Fixed Quantity', value: ChildProcessMultiInstanceSourceTypeEnum.FIXED_QUANTITY },
  { label: 'Number Form', value: ChildProcessMultiInstanceSourceTypeEnum.NUMBER_FORM },
  { label: 'Multiple Choice Form', value: ChildProcessMultiInstanceSourceTypeEnum.MULTIPLE_FORM }
]
