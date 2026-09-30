import request from '@/config/axios'

export interface MeetingRoomBookingVO {
  id?: number // 编号
  no?: string // 预定单号
  roomId?: number // 会议室编号
  roomName?: string // 会议室
  roomLocation?: string // 位置
  roomType?: number // 会议室类型
  title?: string // 会议主题
  startTime?: string // 开始时间
  endTime?: string // 结束时间
  moderatorUserId?: number // 主持人编号
  moderatorName?: string // 主持人
  attendeeUserIds: number[] // 参会人编号
  attendeeNames?: string[] // 参会人
  reminderType?: number // 提醒方式
  description?: string // 会议内容
  deptId?: number // 申请部门编号
  deptName?: string // 申请部门
  creatorName?: string // 申请人
  status?: number // 审批状态
  useStatus?: number // 使用状态
  needApproval?: boolean // 需要审批
  processInstanceId?: string // 流程实例编号
  remark?: string // 备注
  fileUrls: string[] // 附件
  createTime?: string // 创建时间
}

// 查询会议室预定分页
export const getMeetingRoomBookingPage = (params: PageParam) => {
  return request.get({ url: '/oa/meeting-room-booking/page', params })
}

// 查询会议室预定详情
export const getMeetingRoomBooking = (id: number) => {
  return request.get({ url: '/oa/meeting-room-booking/get', params: { id } })
}

// 新增会议室预定
export const createMeetingRoomBooking = (data: MeetingRoomBookingVO) => {
  return request.post({ url: '/oa/meeting-room-booking/create', data })
}

// 修改会议室预定
export const updateMeetingRoomBooking = (data: MeetingRoomBookingVO) => {
  return request.put({ url: '/oa/meeting-room-booking/update', data })
}

// 删除会议室预定
export const deleteMeetingRoomBooking = (id: number) => {
  return request.delete({ url: '/oa/meeting-room-booking/delete', params: { id } })
}

// 提交会议室预定
export const submitMeetingRoomBooking = (id: number) => {
  return request.put({ url: '/oa/meeting-room-booking/submit', params: { id } })
}

// 取消会议室预定
export const cancelMeetingRoomBooking = (id: number) => {
  return request.put({ url: '/oa/meeting-room-booking/cancel', params: { id } })
}

// 开始使用会议室预定
export const startMeetingRoomBooking = (id: number) => {
  return request.put({ url: '/oa/meeting-room-booking/start', params: { id } })
}

// 完成使用会议室预定
export const finishMeetingRoomBooking = (id: number) => {
  return request.put({ url: '/oa/meeting-room-booking/finish', params: { id } })
}

// 查询会议室日程
export const getMeetingRoomBookingSchedule = (
  roomId: number,
  startTime: string,
  endTime: string
) => {
  return request.get({
    url: '/oa/meeting-room-booking/schedule',
    params: { roomId, startTime, endTime }
  })
}
