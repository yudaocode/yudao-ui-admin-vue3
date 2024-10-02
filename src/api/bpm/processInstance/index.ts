import request from '@/config/axios'
import { ProcessDefinitionVO } from '@/api/bpm/model'
import { NodeType } from '@/components/SimpleProcessDesignerV2/src/consts'
export type Task = {
  id: string
  name: string
}

export type ProcessInstanceVO = {
  id: number
  name: string
  processDefinitionId: string
  category: string
  result: number
  tasks: Task[]
  fields: string[]
  status: number
  remark: string
  businessKey: string
  createTime: string
  endTime: string
  processDefinition?: ProcessDefinitionVO
}

// 用户信息
export type User = {
  id: number,
  nickname: string,
  avatar: string
}

// 审批任务信息
export type ApprovalTaskInfo = {
  id: number,
  ownerUser: User,
  assigneeUser: User,
  status: number,
  reason: string

}

// 审批节点信息
export type ApprovalNodeInfo = {
  id : number
  name: string
  nodeType: NodeType
  status: number
  startTime?: Date
  endTime?: Date
  candidateUserList?: User[]
  tasks: ApprovalTaskInfo[]
}

export const getProcessInstanceMyPage = async (params: any) => {
  return await request.get({ url: '/bpm/process-instance/my-page', params })
}

export const getProcessInstanceManagerPage = async (params: any) => {
  return await request.get({ url: '/bpm/process-instance/manager-page', params })
}

export const createProcessInstance = async (data) => {
  return await request.post({ url: '/bpm/process-instance/create', data: data })
}

export const cancelProcessInstanceByStartUser = async (id: number, reason: string) => {
  const data = {
    id: id,
    reason: reason
  }
  return await request.delete({ url: '/bpm/process-instance/cancel-by-start-user', data: data })
}

export const cancelProcessInstanceByAdmin = async (id: number, reason: string) => {
  const data = {
    id: id,
    reason: reason
  }
  return await request.delete({ url: '/bpm/process-instance/cancel-by-admin', data: data })
}

export const getProcessInstance = async (id: string) => {
  return await request.get({ url: '/bpm/process-instance/get?id=' + id })
}

export const getProcessInstanceCopyPage = async (params: any) => {
  return await request.get({ url: '/bpm/process-instance/copy/page', params })
}

// 获取审批详情
export const getApprovalDetail = async (processInstanceId?:string, processDefinitionId?:string) => {
  const param = processInstanceId ? '?processInstanceId='+ processInstanceId : '?processDefinitionId='+ processDefinitionId
  return await request.get({ url: 'bpm/process-instance/get-approval-detail'+ param })
}

// 获取表单字段权限
export const getFormFieldsPermission = async (params: any) => {
  return await request.get({ url: '/bpm/process-instance/get-form-fields-permission', params })
}
