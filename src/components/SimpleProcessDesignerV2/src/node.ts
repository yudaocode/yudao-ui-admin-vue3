import { TaskStatusEnum } from '@/api/bpm/task'
import * as RoleApi from '@/api/system/role'
import * as DeptApi from '@/api/system/dept'
import * as PostApi from '@/api/system/post'
import * as UserApi from '@/api/system/user'
import * as UserGroupApi from '@/api/bpm/userGroup'
import {
  SimpleFlowNode,
  CandidateStrategy,
  NodeType,
  ApproveMethodType,
  RejectHandlerType,
  NODE_DEFAULT_NAME,
  AssignStartUserHandlerType,
  AssignEmptyHandlerType,
  FieldPermissionType,
  HttpRequestParam,
  ProcessVariableEnum,
  ConditionType,
  ConditionGroup,
  COMPARISON_OPERATORS
} from './consts'
import { parseFormFields } from '@/components/FormCreate/src/utils'

export function useWatchNode(props: { flowNode: SimpleFlowNode }): Ref<SimpleFlowNode> {
  const node = ref<SimpleFlowNode>(props.flowNode)
  watch(
    () => props.flowNode,
    (newValue) => {
      node.value = newValue
    }
  )
  return node
}

// 解析 formCreate 所有表单字段, 并返回
const parseFormCreateFields = (formFields?: string[]) => {
  const result: Array<Record<string, any>> = []
  if (formFields) {
    formFields.forEach((fieldStr: string) => {
      parseFormFields(JSON.parse(fieldStr), result)
    })
  }
  return result
}

/**
 * @description 表单数据权限配置，用于发起人节点 、审批节点、抄送节点
 */
export function useFormFieldsPermission(defaultPermission: FieldPermissionType) {
  // 字段权限配置. 需要有 field, title,  permissioin 属性
  const fieldsPermissionConfig = ref<Array<Record<string, any>>>([])

  const formType = inject<Ref<number | undefined>>('formType', ref()) // 表单类型

  const formFields = inject<Ref<string[]>>('formFields', ref([])) // 流程表单字段

  const getNodeConfigFormFields = (nodeFormFields?: Array<Record<string, string>>) => {
    nodeFormFields = toRaw(nodeFormFields)
    if (!nodeFormFields || nodeFormFields.length === 0) {
      fieldsPermissionConfig.value = getDefaultFieldsPermission(unref(formFields))
    } else {
      fieldsPermissionConfig.value = mergeFieldsPermission(nodeFormFields, unref(formFields))
    }
  }
  // 合并已经设置的表单字段权限，当前流程表单字段 (可能新增，或删除了字段)
  const mergeFieldsPermission = (
    formFieldsPermisson: Array<Record<string, string>>,
    formFields?: string[]
  ) => {
    let mergedFieldsPermission: Array<Record<string, any>> = []
    if (formFields) {
      mergedFieldsPermission = parseFormCreateFields(formFields).map((item) => {
        const found = formFieldsPermisson.find(
          (fieldPermission) => fieldPermission.field == item.field
        )
        return {
          field: item.field,
          title: item.title,
          permission: found ? found.permission : defaultPermission
        }
      })
    }
    return mergedFieldsPermission
  }

  // 默认的表单权限： 获取表单的所有字段，设置字段默认权限为只读
  const getDefaultFieldsPermission = (formFields?: string[]) => {
    let defaultFieldsPermission: Array<Record<string, any>> = []
    if (formFields) {
      defaultFieldsPermission = parseFormCreateFields(formFields).map((item) => {
        return {
          field: item.field,
          title: item.title,
          permission: defaultPermission
        }
      })
    }
    return defaultFieldsPermission
  }

  // 获取表单的所有字段，作为下拉框选项
  const formFieldOptions = parseFormCreateFields(unref(formFields))

  return {
    formType,
    fieldsPermissionConfig,
    formFieldOptions,
    getNodeConfigFormFields
  }
}

/**
 * @description 获取流程表单的字段
 */
export function useFormFields() {
  const formFields = inject<Ref<string[]>>('formFields', ref([])) // 流程表单字段
  return parseFormCreateFields(unref(formFields))
}

// TODO @芋艿：后续需要把各种类似 useFormFieldsPermission 的逻辑，抽成一个通用方法。
/**
 * @description 获取流程表单的字段和发起人字段
 */
export function useFormFieldsAndStartUser() {
  const injectFormFields = inject<Ref<string[]>>('formFields', ref([])) // 流程表单字段
  const formFields = parseFormCreateFields(unref(injectFormFields))
  // 添加发起人
  formFields.unshift({
    field: ProcessVariableEnum.START_USER_ID,
    title: '发起人',
    required: true
  })
  return formFields
}

export type UserTaskFormType = {
  candidateStrategy: CandidateStrategy
  approveMethod: ApproveMethodType
  roleIds?: number[] // 角色
  deptIds?: number[] // 部门
  deptLevel?: number // 部门层级
  userIds?: number[] // 用户
  userGroups?: number[] // 用户组
  postIds?: number[] // 岗位
  expression?: string // 流程表达式
  formUser?: string // 表单内用户字段
  formDept?: string // 表单内部门字段
  approveRatio?: number
  rejectHandlerType?: RejectHandlerType
  returnNodeId?: string
  timeoutHandlerEnable?: boolean
  timeoutHandlerType?: number
  assignEmptyHandlerType?: AssignEmptyHandlerType
  assignEmptyHandlerUserIds?: number[]
  assignStartUserHandlerType?: AssignStartUserHandlerType
  timeDuration?: number
  maxRemindCount?: number
  buttonsSetting: any[]
  taskCreateListenerEnable?: boolean
  taskCreateListenerPath?: string
  taskCreateListener?: {
    header: HttpRequestParam[]
    body: HttpRequestParam[]
  }
  taskAssignListenerEnable?: boolean
  taskAssignListenerPath?: string
  taskAssignListener?: {
    header: HttpRequestParam[]
    body: HttpRequestParam[]
  }
  taskCompleteListenerEnable?: boolean
  taskCompleteListenerPath?: string
  taskCompleteListener?: {
    header: HttpRequestParam[]
    body: HttpRequestParam[]
  }
  signEnable: boolean
  reasonRequire: boolean
}

export type CopyTaskFormType = {
  candidateStrategy: CandidateStrategy
  roleIds?: number[] // 角色
  deptIds?: number[] // 部门
  deptLevel?: number // 部门层级
  userIds?: number[] // 用户
  userGroups?: number[] // 用户组
  postIds?: number[] // 岗位
  formUser?: string // 表单内用户字段
  formDept?: string // 表单内部门字段
  expression?: string // 流程表达式
}

/**
 * @description 节点表单数据。 用于审批节点、抄送节点
 */
export function useNodeForm(nodeType: NodeType) {
  const roleOptions = inject<Ref<RoleApi.RoleVO[]>>('roleList', ref([])) // 角色列表
  const postOptions = inject<Ref<PostApi.PostVO[]>>('postList', ref([])) // 岗位列表
  const userOptions = inject<Ref<UserApi.UserVO[]>>('userList', ref([])) // 用户列表
  const deptOptions = inject<Ref<DeptApi.DeptVO[]>>('deptList', ref([])) // 部门列表
  const userGroupOptions = inject<Ref<UserGroupApi.UserGroupVO[]>>('userGroupList', ref([])) // 用户组列表
  const deptTreeOptions = inject('deptTree', ref()) // 部门树
  const formFields = inject<Ref<string[]>>('formFields', ref([])) // 流程表单字段
  const configForm = ref<UserTaskFormType | CopyTaskFormType>()
  if (nodeType === NodeType.USER_TASK_NODE || nodeType === NodeType.TRANSACTOR_NODE) {
    configForm.value = {
      candidateStrategy: CandidateStrategy.USER,
      approveMethod: ApproveMethodType.SEQUENTIAL_APPROVE,
      approveRatio: 100,
      rejectHandlerType: RejectHandlerType.FINISH_PROCESS,
      assignStartUserHandlerType: AssignStartUserHandlerType.START_USER_AUDIT,
      returnNodeId: '',
      timeoutHandlerEnable: false,
      timeoutHandlerType: 1,
      timeDuration: 6, // 默认 6小时
      maxRemindCount: 1, // 默认 提醒 1次
      buttonsSetting: []
    }
  } else {
    configForm.value = {
      candidateStrategy: CandidateStrategy.USER
    }
  }

  const getShowText = (): string => {
    let showText = ''
    // 指定成员
    if (configForm.value?.candidateStrategy === CandidateStrategy.USER) {
      if (configForm.value?.userIds!.length > 0) {
        const candidateNames: string[] = []
        userOptions?.value.forEach((item) => {
          if (configForm.value?.userIds!.includes(item.id)) {
            candidateNames.push(item.nickname)
          }
        })
        showText = `指定成员：${candidateNames.join(',')}`
      }
    }
    // 指定角色
    if (configForm.value?.candidateStrategy === CandidateStrategy.ROLE) {
      if (configForm.value.roleIds!.length > 0) {
        const candidateNames: string[] = []
        roleOptions?.value.forEach((item) => {
          if (configForm.value?.roleIds!.includes(item.id)) {
            candidateNames.push(item.name)
          }
        })
        showText = `指定角色：${candidateNames.join(',')}`
      }
    }
    // 指定部门
    if (
      configForm.value?.candidateStrategy === CandidateStrategy.DEPT_MEMBER ||
      configForm.value?.candidateStrategy === CandidateStrategy.DEPT_LEADER ||
      configForm.value?.candidateStrategy === CandidateStrategy.MULTI_LEVEL_DEPT_LEADER
    ) {
      if (configForm.value?.deptIds!.length > 0) {
        const candidateNames: string[] = []
        deptOptions?.value.forEach((item) => {
          if (configForm.value?.deptIds!.includes(item.id!)) {
            candidateNames.push(item.name)
          }
        })
        if (configForm.value.candidateStrategy === CandidateStrategy.DEPT_MEMBER) {
          showText = `部门成员：${candidateNames.join(',')}`
        } else if (configForm.value.candidateStrategy === CandidateStrategy.DEPT_LEADER) {
          showText = `部门的负责人：${candidateNames.join(',')}`
        } else {
          showText = `多级部门的负责人：${candidateNames.join(',')}`
        }
      }
    }

    // 指定岗位
    if (configForm.value?.candidateStrategy === CandidateStrategy.POST) {
      if (configForm.value.postIds!.length > 0) {
        const candidateNames: string[] = []
        postOptions?.value.forEach((item) => {
          if (configForm.value?.postIds!.includes(item.id!)) {
            candidateNames.push(item.name)
          }
        })
        showText = `指定岗位: ${candidateNames.join(',')}`
      }
    }
    // 指定用户组
    if (configForm.value?.candidateStrategy === CandidateStrategy.USER_GROUP) {
      if (configForm.value?.userGroups!.length > 0) {
        const candidateNames: string[] = []
        userGroupOptions?.value.forEach((item) => {
          if (configForm.value?.userGroups!.includes(item.id)) {
            candidateNames.push(item.name)
          }
        })
        showText = `指定用户组: ${candidateNames.join(',')}`
      }
    }

    // 表单内用户字段
    if (configForm.value?.candidateStrategy === CandidateStrategy.FORM_USER) {
      const formFieldOptions = parseFormCreateFields(unref(formFields))
      const item = formFieldOptions.find((item) => item.field === configForm.value?.formUser)
      showText = `表单用户：${item?.title}`
    }

    // 表单内部门负责人
    if (configForm.value?.candidateStrategy === CandidateStrategy.FORM_DEPT_LEADER) {
      showText = `表单内部门负责人`
    }

    // 审批人自选
    if (configForm.value?.candidateStrategy === CandidateStrategy.APPROVE_USER_SELECT) {
      showText = `审批人自选`
    }

    // 发起人自选
    if (configForm.value?.candidateStrategy === CandidateStrategy.START_USER_SELECT) {
      showText = `发起人自选`
    }
    // 发起人自己
    if (configForm.value?.candidateStrategy === CandidateStrategy.START_USER) {
      showText = `发起人自己`
    }
    // 发起人的部门负责人
    if (configForm.value?.candidateStrategy === CandidateStrategy.START_USER_DEPT_LEADER) {
      showText = `发起人的部门负责人`
    }
    // 发起人的部门负责人
    if (
      configForm.value?.candidateStrategy === CandidateStrategy.START_USER_MULTI_LEVEL_DEPT_LEADER
    ) {
      showText = `发起人连续部门负责人`
    }
    // 流程表达式
    if (configForm.value?.candidateStrategy === CandidateStrategy.EXPRESSION) {
      showText = `流程表达式：${configForm.value.expression}`
    }
    return showText
  }

  /**
   *  处理候选人参数的赋值
   */
  const handleCandidateParam = () => {
    let candidateParam: undefined | string = undefined
    if (!configForm.value) {
      return candidateParam
    }
    switch (configForm.value.candidateStrategy) {
      case CandidateStrategy.USER:
        candidateParam = configForm.value.userIds!.join(',')
        break
      case CandidateStrategy.ROLE:
        candidateParam = configForm.value.roleIds!.join(',')
        break
      case CandidateStrategy.POST:
        candidateParam = configForm.value.postIds!.join(',')
        break
      case CandidateStrategy.USER_GROUP:
        candidateParam = configForm.value.userGroups!.join(',')
        break
      case CandidateStrategy.FORM_USER:
        candidateParam = configForm.value.formUser!
        break
      case CandidateStrategy.EXPRESSION:
        candidateParam = configForm.value.expression!
        break
      case CandidateStrategy.DEPT_MEMBER:
      case CandidateStrategy.DEPT_LEADER:
        candidateParam = configForm.value.deptIds!.join(',')
        break
      // 发起人部门负责人
      case CandidateStrategy.START_USER_DEPT_LEADER:
      case CandidateStrategy.START_USER_MULTI_LEVEL_DEPT_LEADER:
        candidateParam = configForm.value.deptLevel + ''
        break
      // 指定连续多级部门的负责人
      case CandidateStrategy.MULTI_LEVEL_DEPT_LEADER: {
        // 候选人参数格式: | 分隔 。左边为部门（多个部门用 , 分隔）。 右边为部门层级
        const deptIds = configForm.value.deptIds!.join(',')
        candidateParam = deptIds.concat('|' + configForm.value.deptLevel + '')
        break
      }
      // 表单内部门的负责人
      case CandidateStrategy.FORM_DEPT_LEADER: {
        // 候选人参数格式: | 分隔 。左边为表单内部门字段。 右边为部门层级
        const deptFieldOnForm = configForm.value.formDept!
        candidateParam = deptFieldOnForm.concat('|' + configForm.value.deptLevel + '')
        break
      }
      default:
        break
    }
    return candidateParam
  }
  /**
   *  解析候选人参数
   */
  const parseCandidateParam = (
    candidateStrategy: CandidateStrategy,
    candidateParam: string | undefined
  ) => {
    if (!configForm.value || !candidateParam) {
      return
    }
    switch (candidateStrategy) {
      case CandidateStrategy.USER: {
        configForm.value.userIds = candidateParam.split(',').map((item) => +item)
        break
      }
      case CandidateStrategy.ROLE:
        configForm.value.roleIds = candidateParam.split(',').map((item) => +item)
        break
      case CandidateStrategy.POST:
        configForm.value.postIds = candidateParam.split(',').map((item) => +item)
        break
      case CandidateStrategy.USER_GROUP:
        configForm.value.userGroups = candidateParam.split(',').map((item) => +item)
        break
      case CandidateStrategy.FORM_USER:
        configForm.value.formUser = candidateParam
        break
      case CandidateStrategy.EXPRESSION:
        configForm.value.expression = candidateParam
        break
      case CandidateStrategy.DEPT_MEMBER:
      case CandidateStrategy.DEPT_LEADER:
        configForm.value.deptIds = candidateParam.split(',').map((item) => +item)
        break
      // 发起人部门负责人
      case CandidateStrategy.START_USER_DEPT_LEADER:
      case CandidateStrategy.START_USER_MULTI_LEVEL_DEPT_LEADER:
        configForm.value.deptLevel = +candidateParam
        break
      // 指定连续多级部门的负责人
      case CandidateStrategy.MULTI_LEVEL_DEPT_LEADER: {
        // 候选人参数格式: | 分隔 。左边为部门（多个部门用 , 分隔）。 右边为部门层级
        const paramArray = candidateParam.split('|')
        configForm.value.deptIds = paramArray[0].split(',').map((item) => +item)
        configForm.value.deptLevel = +paramArray[1]
        break
      }
      // 表单内的部门负责人
      case CandidateStrategy.FORM_DEPT_LEADER: {
        // 候选人参数格式: | 分隔 。左边为表单内的部门字段。 右边为部门层级
        const paramArray = candidateParam.split('|')
        configForm.value.formDept = paramArray[0]
        configForm.value.deptLevel = +paramArray[1]
        break
      }
      default:
        break
    }
  }
  return {
    configForm,
    roleOptions,
    postOptions,
    userOptions,
    userGroupOptions,
    deptTreeOptions,
    handleCandidateParam,
    parseCandidateParam,
    getShowText
  }
}

/**
 * @description 抽屉配置
 */
export function useDrawer() {
  // 抽屉配置是否可见
  const settingVisible = ref(false)
  // 关闭配置抽屉
  const closeDrawer = () => {
    settingVisible.value = false
  }
  // 打开配置抽屉
  const openDrawer = () => {
    settingVisible.value = true
  }
  return {
    settingVisible,
    closeDrawer,
    openDrawer
  }
}

/**
 * @description 节点名称配置
 */
export function useNodeName(nodeType: NodeType) {
  // 节点名称
  const nodeName = ref<string>()
  // 节点名称输入框
  const showInput = ref(false)
  // 点击节点名称编辑图标
  const clickIcon = () => {
    showInput.value = true
  }
  // 节点名称输入框失去焦点
  const blurEvent = () => {
    showInput.value = false
    nodeName.value = nodeName.value || (NODE_DEFAULT_NAME.get(nodeType) as string)
  }
  return {
    nodeName,
    showInput,
    clickIcon,
    blurEvent
  }
}

export function useNodeName2(node: Ref<SimpleFlowNode>, nodeType: NodeType) {
  // 显示节点名称输入框
  const showInput = ref(false)
  // 节点名称输入框失去焦点
  const blurEvent = () => {
    showInput.value = false
    node.value.name = node.value.name || (NODE_DEFAULT_NAME.get(nodeType) as string)
  }
  // 点击节点标题进行输入
  const clickTitle = () => {
    showInput.value = true
  }
  return {
    showInput,
    clickTitle,
    blurEvent
  }
}

/**
 * @description 根据节点任务状态，获取节点任务状态样式
 */
export function useTaskStatusClass(taskStatus: TaskStatusEnum | undefined): string {
  if (!taskStatus) {
    return ''
  }
  if (taskStatus === TaskStatusEnum.APPROVE) {
    return 'status-pass'
  }
  if (taskStatus === TaskStatusEnum.RUNNING) {
    return 'status-running'
  }
  if (taskStatus === TaskStatusEnum.REJECT) {
    return 'status-reject'
  }
  if (taskStatus === TaskStatusEnum.CANCEL) {
    return 'status-cancel'
  }
  return ''
}

/** 条件组件文字展示 */
export function getConditionShowText(
  conditionType: ConditionType | undefined,
  conditionExpression: string | undefined,
  conditionGroups: ConditionGroup | undefined,
  fieldOptions: Array<Record<string, any>>
) {
  let showText = ''
  if (conditionType === ConditionType.EXPRESSION) {
    if (conditionExpression) {
      showText = `表达式：${conditionExpression}`
    }
  }
  if (conditionType === ConditionType.RULE) {
    // 条件组是否为与关系
    const groupAnd = conditionGroups?.and
    let warningMessage: undefined | string = undefined
    const conditionGroup = conditionGroups?.conditions.map((item) => {
      return (
        '(' +
        item.rules
          .map((rule) => {
            if (rule.leftSide && rule.rightSide) {
              return (
                getFormFieldTitle(fieldOptions, rule.leftSide) +
                ' ' +
                getOpName(rule.opCode) +
                ' ' +
                rule.rightSide
              )
            } else {
              // 有一条规则不完善。提示错误
              warningMessage = '请完善条件规则'
              return ''
            }
          })
          .join(item.and ? ' 且 ' : ' 或 ') +
        ' ) '
      )
    })
    if (warningMessage) {
      showText = ''
    } else {
      showText = conditionGroup!.join(groupAnd ? ' 且 ' : ' 或 ')
    }
  }
  return showText
}

/** 获取表单字段名称*/
const getFormFieldTitle = (fieldOptions: Array<Record<string, any>>, field: string) => {
  const item = fieldOptions.find((item) => item.field === field)
  return item?.title
}

/** 获取操作符名称 */
const getOpName = (opCode: string): string => {
  const opName = COMPARISON_OPERATORS.find((item: any) => item.value === opCode)
  return opName?.label
}
