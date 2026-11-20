import request from '@/config/axios'

/**
 * 任务状态枚举
 */
export enum TaskStatusEnum {
  /**
   * 跳过
   */
  SKIP = -2,
  /**
   * 未开始
   */
  NOT_START = -1,

  /**
   * 待审批
   */
  WAIT = 0,
  /**
   * 审批中
   */
  RUNNING = 1,
  /**
   * 审批通过
   */
  APPROVE = 2,

  /**
   * 审批不通过
   */
  REJECT = 3,

  /**
   * 已取消
   */
  CANCEL = 4,
  /**
   * 已退回
   */
  RETURN = 5,
  /**
   * 审批通过中
   */
  APPROVING = 7,
  /**
   * 已退回，等待修改：修改人重新提交后，由审批人继续审批
   */
  WAIT_REVISION = 8
}

/** 退回修改后，重新提交的请求 */
export interface TaskResubmitReqVO {
  taskId: string // 任务编号
  revisionId: string // 退回修改的批次编号，来自审批详情
  variables: Record<string, any> // 修改的表单变量，只能包含退回目标节点可编辑的字段
}

export const getTaskTodoPage = async (params: any) => {
  return await request.get({ url: '/bpm/task/todo-page', params })
}

// 获取退回修改中的任务分页（待我修改）
export const getTaskRevisionPage = async (params: PageParam) => {
  return await request.get({ url: '/bpm/task/revision-page', params })
}

// 退回修改后，重新提交
export const resubmitTask = async (data: TaskResubmitReqVO) => {
  return await request.put({ url: '/bpm/task/resubmit', data })
}

export const getTaskDonePage = async (params: any) => {
  return await request.get({ url: '/bpm/task/done-page', params })
}

export const getTaskManagerPage = async (params: any) => {
  return await request.get({ url: '/bpm/task/manager-page', params })
}

export const approveTask = async (data: any) => {
  return await request.put({ url: '/bpm/task/approve', data })
}

export const rejectTask = async (data: any) => {
  return await request.put({ url: '/bpm/task/reject', data })
}

export const getTaskListByProcessInstanceId = async (processInstanceId: string) => {
  return await request.get({
    url: '/bpm/task/list-by-process-instance-id?processInstanceId=' + processInstanceId
  })
}

// 获取所有可退回的节点
export const getTaskListByReturn = async (id: string) => {
  return await request.get({ url: '/bpm/task/list-by-return', params: { id } })
}

// 退回
export const returnTask = async (data: any) => {
  return await request.put({ url: '/bpm/task/return', data })
}

// 委派
export const delegateTask = async (data: any) => {
  return await request.put({ url: '/bpm/task/delegate', data })
}

// 转派
export const transferTask = async (data: any) => {
  return await request.put({ url: '/bpm/task/transfer', data })
}

// 加签
export const signCreateTask = async (data: any) => {
  return await request.put({ url: '/bpm/task/create-sign', data })
}

// 减签
export const signDeleteTask = async (data: any) => {
  return await request.delete({ url: '/bpm/task/delete-sign', data })
}

// 抄送
export const copyTask = async (data: any) => {
  return await request.put({ url: '/bpm/task/copy', data })
}

// 撤回
export const withdrawTask = async (taskId: string) => {
  return await request.put({ url: '/bpm/task/withdraw', params: { taskId } })
}

// 获取我的待办任务
export const myTodoTask = async (processInstanceId: string) => {
  return await request.get({ url: '/bpm/task/my-todo?processInstanceId=' + processInstanceId })
}

// 获取减签任务列表
export const getChildrenTaskList = async (id: string) => {
  return await request.get({ url: '/bpm/task/list-by-parent-task-id?parentTaskId=' + id })
}
