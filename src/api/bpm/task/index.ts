import request from '@/config/axios'

export type TaskVO = {
  id: number
}

export const getTodoTaskPage = async (params) => {
  return await request.get({ url: '/bpm/task/todo-page', params })
}

export const getDoneTaskPage = async (params) => {
  return await request.get({ url: '/bpm/task/done-page', params })
}

export const completeTask = async (data) => {
  return await request.put({ url: '/bpm/task/complete', data })
}

export const approveTask = async (data) => {
  return await request.put({ url: '/bpm/task/approve', data })
}

export const rejectTask = async (data) => {
  return await request.put({ url: '/bpm/task/reject', data })
}
export const backTask = async (data) => {
  return await request.put({ url: '/bpm/task/back', data })
}

export const updateTaskAssignee = async (data) => {
  return await request.put({ url: '/bpm/task/update-assignee', data })
}

export const getTaskListByProcessInstanceId = async (processInstanceId) => {
  return await request.get({
    url: '/bpm/task/list-by-process-instance-id?processInstanceId=' + processInstanceId
  })
}

// 导出任务
export const exportTask = async (params) => {
  return await request.download({ url: '/bpm/task/export', params })
}

// 获取所有可回退的节点
export const getReturnList = async (params) => {
  return await request.get({ url: '/bpm/task/get-return-list', params })
}

// 回退
export const returnTask = async (data) => {
  return await request.put({ url: '/bpm/task/return', data })
}

/**
 * 委派
 */
export const delegateTask = async (data) => {
  return await request.put({ url: '/bpm/task/delegate', data })
}

/**
 * 加签
 */
export const taskAddSign = async (data) => {
  return await request.put({ url: '/bpm/task/create-sign', data })
}

/**
 * 获取减签任务列表
 */
export const getChildrenTaskList = async (id: string) => {
  return await request.get({ url: '/bpm/task/children-list?taskId=' + id })
}

/**
 * 减签
 */
export const taskSubSign = async (data) => {
  return await request.delete({ url: '/bpm/task/delete-sign', data })
}
