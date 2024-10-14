import { cloneDeep } from 'lodash-es'
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
  FieldPermissionType
} from './consts'
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

/**
 * @description 表单数据权限配置，用于发起人节点 、审批节点、抄送节点
 */
export function useFormFieldsPermission(defaultPermission: FieldPermissionType) {
  // 字段权限配置. 需要有 field, title,  permissioin 属性
  const fieldsPermissionConfig = ref<Array<Record<string, string>>>([])

  const formType = inject<Ref<number>>('formType') // 表单类型

  const formFields = inject<Ref<string[]>>('formFields') // 流程表单字段

  const getNodeConfigFormFields = (nodeFormFields?: Array<Record<string, string>>) => {
    nodeFormFields = toRaw(nodeFormFields)
    fieldsPermissionConfig.value =
      cloneDeep(nodeFormFields) || getDefaultFieldsPermission(unref(formFields))
  }
  // 默认的表单权限： 获取表单的所有字段，设置字段默认权限为只读
  const getDefaultFieldsPermission = (formFields?: string[]) => {
    const defaultFieldsPermission: Array<Record<string, string>> = []
    if (formFields) {
      formFields.forEach((fieldStr: string) => {
        parseFieldsSetDefaultPermission(JSON.parse(fieldStr), defaultFieldsPermission)
      })
    }
    return defaultFieldsPermission
  }
  // 解析字段。赋给默认权限
  const parseFieldsSetDefaultPermission = (
    rule: Record<string, any>,
    fieldsPermission: Array<Record<string, string>>,
    parentTitle: string = ''
  ) => {
    const { /**type,*/ field, title: tempTitle, children } = rule
    if (field && tempTitle) {
      let title = tempTitle
      if (parentTitle) {
        title = `${parentTitle}.${tempTitle}`
      }
      fieldsPermission.push({
        field,
        title,
        permission: defaultPermission
      })
      // TODO 子表单 需要处理子表单字段
      // if (type === 'group' && rule.props?.rule && Array.isArray(rule.props.rule)) {
      //   // 解析子表单的字段
      //   rule.props.rule.forEach((item) => {
      //     parseFieldsSetDefaultPermission(item, fieldsPermission, title)
      //   })
      // }
    }
    if (children && Array.isArray(children)) {
      children.forEach((rule) => {
        parseFieldsSetDefaultPermission(rule, fieldsPermission)
      })
    }
  }

  return {
    formType,
    fieldsPermissionConfig,
    getNodeConfigFormFields
  }
}
/**
 * @description 获取表单的字段
 */
export function useFormFields() {
  // 解析后的表单字段
  const formFields = inject<Ref<string[]>>('formFields') // 流程表单字段
  const parseFormFields = () => {
    const parsedFormFields: Array<Record<string, string>> = []
    if (formFields) {
      formFields.value.forEach((fieldStr: string) => {
        parseField(JSON.parse(fieldStr), parsedFormFields)
      })
    }
    return parsedFormFields
  }
  // 解析字段。
  const parseField = (
    rule: Record<string, any>,
    parsedFormFields: Array<Record<string, string>>,
    parentTitle: string = ''
  ) => {
    const { field, title: tempTitle, children, type } = rule
    if (field && tempTitle) {
      let title = tempTitle
      if (parentTitle) {
        title = `${parentTitle}.${tempTitle}`
      }
      parsedFormFields.push({
        field,
        title,
        type
      })
      // TODO 子表单 需要处理子表单字段
      // if (type === 'group' && rule.props?.rule && Array.isArray(rule.props.rule)) {
      //   // 解析子表单的字段
      //   rule.props.rule.forEach((item) => {
      //     parseFieldsSetDefaultPermission(item, fieldsPermission, title)
      //   })
      // }
    }
    if (children && Array.isArray(children)) {
      children.forEach((rule) => {
        parseField(rule, parsedFormFields)
      })
    }
  }

  return parseFormFields()
}

export type UserTaskFormType = {
  //candidateParamArray: any[]
  candidateStrategy: CandidateStrategy
  approveMethod: ApproveMethodType
  roleIds?: number[] // 角色
  deptIds?: number[] // 部门
  deptLevel?: number // 部门层级
  userIds?: number[] // 用户
  userGroups?: number[] // 用户组
  postIds?: number[] // 岗位
  expression?: string // 流程表达式
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
}

export type CopyTaskFormType = {
  // candidateParamArray: any[]
  candidateStrategy: CandidateStrategy
  roleIds?: number[] // 角色
  deptIds?: number[] // 部门
  deptLevel?: number // 部门层级
  userIds?: number[] // 用户
  userGroups?: number[] // 用户组
  postIds?: number[] // 岗位
  expression?: string // 流程表达式
}

/**
 * @description 节点表单数据。 用于审批节点、抄送节点
 */
export function useNodeForm(nodeType: NodeType) {
  const roleOptions = inject<Ref<RoleApi.RoleVO[]>>('roleList') // 角色列表
  const postOptions = inject<Ref<PostApi.PostVO[]>>('postList') // 岗位列表
  const userOptions = inject<Ref<UserApi.UserVO[]>>('userList') // 用户列表
  const deptOptions = inject<Ref<DeptApi.DeptVO[]>>('deptList') // 部门列表
  const userGroupOptions = inject<Ref<UserGroupApi.UserGroupVO[]>>('userGroupList') // 用户组列表
  const deptTreeOptions = inject('deptTree') // 部门树
  const configForm = ref<UserTaskFormType | CopyTaskFormType>()
  if (nodeType === NodeType.USER_TASK_NODE) {
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
