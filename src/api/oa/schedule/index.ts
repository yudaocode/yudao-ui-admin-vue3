import request from '@/config/axios'

export interface OaScheduleVO {
  id?: number // 日程编号
  creator?: string // 创建人用户编号
  creatorName?: string // 创建人用户昵称
  creatorDeptName?: string // 发布人部门名称
  type: number // 日程类型
  priority: number // 优先级
  title: string // 标题
  description?: string // 描述
  startTime: string // 开始时间
  endTime: string // 结束时间
  remind: boolean // 是否提醒
  participantUserIds?: number[] // 参与人用户编号列表
  participantUserNames?: string[] // 参与人用户昵称列表
  createTime?: string // 创建时间
  participants?: {
    userId: number // 参与人用户编号
    userName: string // 参与人用户昵称
    readStatus: boolean // 是否已读
    readTime?: string // 首次阅读时间
  }[] // 参与人阅读信息，仅详情返回
}

// 查询所选范围内的日程分页
export const getSchedulePage = (params: PageParam) => {
  return request.get({ url: '/oa/schedule/page', params })
}

// 查询我的日程分页
export const getMySchedulePage = (params: PageParam) => {
  return request.get({ url: '/oa/schedule/my-page', params })
}

// 查询共享给我的日程分页
export const getReceivedSchedulePage = (params: PageParam) => {
  return request.get({ url: '/oa/schedule/received-page', params })
}

// 查询日程详情
export const getSchedule = (id: number) => {
  return request.get({ url: '/oa/schedule/get', params: { id } })
}

// 标记本人已阅读日程
export const updateScheduleReadStatus = (id: number) => {
  return request.put({ url: '/oa/schedule/update-read-status', params: { id } })
}

// 新增日程
export const createSchedule = (data: OaScheduleVO) => {
  return request.post({ url: '/oa/schedule/create', data })
}

// 修改日程
export const updateSchedule = (data: OaScheduleVO) => {
  return request.put({ url: '/oa/schedule/update', data })
}

// 删除日程
export const deleteSchedule = (id: number) => {
  return request.delete({ url: '/oa/schedule/delete', params: { id } })
}
