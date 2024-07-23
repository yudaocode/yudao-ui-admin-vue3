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
  NODE_DEFAULT_NAME
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
 * @description 表单数据权限配置，用于审批节点、抄送节点
 */
export function useFormFieldsPermission() {
  // 字段权限配置. 需要有 field, title,  permissioin 属性
  const fieldsPermissionConfig = ref<Array<Record<string, string>>>([])

  const formType = inject<Ref<number>>('formType') // 表单类型

  const formFields = inject<Ref<string[]>>('formFields') // 流程表单字段

  const getNodeConfigFormFields = (nodeFormFields?: Array<Record<string, string>>) => {
    nodeFormFields = toRaw(nodeFormFields)
    fieldsPermissionConfig.value =
      cloneDeep(nodeFormFields) || getDefaultFieldsPermission(unref(formFields))
  }
  // 获取默认的表单权限。 所有字段只读
  const getDefaultFieldsPermission = (formFields?: string[]) => {
    const defaultFieldsPermission: Array<Record<string, string>> = []
    if (formFields) {
      formFields.forEach((fieldStr: string) => {
        const { field, title } = JSON.parse(fieldStr)
        defaultFieldsPermission.push({
          field,
          title,
          permission: '1' // 只读
        })
      })
    }
    return defaultFieldsPermission
  }

  return {
    formType,
    fieldsPermissionConfig,
    getNodeConfigFormFields
  }
}

export type UserTaskFormType = {
  candidateParamArray: any[]
  candidateStrategy: CandidateStrategy
  approveMethod: ApproveMethodType
  approveRatio?: number
  rejectHandlerType?: RejectHandlerType
  returnNodeId?: string
  timeoutHandlerEnable?: boolean
  timeoutHandlerAction?: number
  timeDuration?: number
  maxRemindCount?: number
  buttonsSetting: any[]
}

export type CopyTaskFormType = {
  candidateParamArray: any[]
  candidateStrategy: CandidateStrategy
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
      candidateParamArray: [],
      candidateStrategy: CandidateStrategy.USER,
      approveMethod: ApproveMethodType.RRANDOM_SELECT_ONE_APPROVE,
      approveRatio: 100,
      rejectHandlerType: RejectHandlerType.FINISH_PROCESS,
      returnNodeId: '',
      timeoutHandlerEnable: false,
      timeoutHandlerAction: 1,
      timeDuration: 6, // 默认 6小时
      maxRemindCount: 1, // 默认 提醒 1次
      buttonsSetting: []
    }
  } else {
    configForm.value = {
      candidateParamArray: [],
      candidateStrategy: CandidateStrategy.USER
    }
  }

  const getShowText = (): string => {
    let showText = ''
    // 指定成员
    if (configForm.value?.candidateStrategy === CandidateStrategy.USER) {
      if (configForm.value.candidateParamArray?.length > 0) {
        const candidateNames: string[] = []
        userOptions?.value.forEach((item) => {
          if (configForm.value?.candidateParamArray.includes(item.id)) {
            candidateNames.push(item.nickname)
          }
        })
        showText = `指定成员：${candidateNames.join(',')}`
      }
    }
    // 指定角色
    if (configForm.value?.candidateStrategy === CandidateStrategy.ROLE) {
      if (configForm.value.candidateParamArray?.length > 0) {
        const candidateNames: string[] = []
        roleOptions?.value.forEach((item) => {
          if (configForm.value?.candidateParamArray.includes(item.id)) {
            candidateNames.push(item.name)
          }
        })
        showText = `指定角色：${candidateNames.join(',')}`
      }
    }
    // 指定部门
    if (
      configForm.value?.candidateStrategy === CandidateStrategy.DEPT_MEMBER ||
      configForm.value?.candidateStrategy === CandidateStrategy.DEPT_LEADER
    ) {
      if (configForm.value?.candidateParamArray?.length > 0) {
        const candidateNames: string[] = []
        deptOptions?.value.forEach((item) => {
          if (configForm.value?.candidateParamArray.includes(item.id)) {
            candidateNames.push(item.name)
          }
        })
        if (configForm.value.candidateStrategy === CandidateStrategy.DEPT_MEMBER) {
          showText = `部门成员：${candidateNames.join(',')}`
        } else {
          showText = `部门的负责人：${candidateNames.join(',')}`
        }
      }
    }

    // 指定岗位
    if (configForm.value?.candidateStrategy === CandidateStrategy.POST) {
      if (configForm.value.candidateParamArray?.length > 0) {
        const candidateNames: string[] = []
        postOptions?.value.forEach((item) => {
          if (configForm.value?.candidateParamArray.includes(item.id)) {
            candidateNames.push(item.name)
          }
        })
        showText = `指定岗位: ${candidateNames.join(',')}`
      }
    }
    // 指定用户组
    if (configForm.value?.candidateStrategy === CandidateStrategy.USER_GROUP) {
      if (configForm.value?.candidateParamArray?.length > 0) {
        const candidateNames: string[] = []
        userGroupOptions?.value.forEach((item) => {
          if (configForm.value?.candidateParamArray.includes(item.id)) {
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

    // 流程表达式
    if (configForm.value?.candidateStrategy === CandidateStrategy.EXPRESSION) {
      if (configForm.value.candidateParamArray?.length > 0) {
        showText = `流程表达式：${configForm.value.candidateParamArray[0]}`
      }
    }
    return showText
  }

  return {
    configForm,
    roleOptions,
    postOptions,
    userOptions,
    userGroupOptions,
    deptTreeOptions,
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
