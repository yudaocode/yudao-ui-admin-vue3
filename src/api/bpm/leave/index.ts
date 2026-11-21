import request from '@/config/axios'

export type LeaveVO = {
  id: number
  status: number
  type: number
  reason: string
  processInstanceId: string
  startTime: string
  endTime: string
  createTime: string
}

// 创建请假申请
export const createLeave = async (data: LeaveVO) => {
  return await request.post({ url: '/bpm/oa/leave/create', data: data })
}

// 请假申请的更新 VO：只传业务编号和修改了的字段，流程信息由后端从请假申请中读取
export type LeaveUpdateVO = {
  id: number
  type?: number
  startTime?: number
  endTime?: number
  reason?: string
}

// 更新请假申请：只能在审批中修改，审批结果由流程详情的【通过】处理
export const updateLeave = async (data: LeaveUpdateVO) => {
  return await request.put({ url: '/bpm/oa/leave/update', data })
}

// 获得请假申请
export const getLeave = async (id: number) => {
  return await request.get({ url: '/bpm/oa/leave/get?id=' + id })
}

// 获得请假申请分页
export const getLeavePage = async (params: PageParam) => {
  return await request.get({ url: '/bpm/oa/leave/page', params })
}
