import request from '@/config/axios'

export interface MeetingRoomVO {
  id?: number // 编号
  name?: string // 名称
  location?: string // 位置
  type?: number // 类型
  managerUserId?: number // 管理员编号
  managerName?: string // 管理员
  managerPhone?: string // 联系电话
  status?: number // 状态
  picUrl?: string // 照片
  seatCount?: number // 座位数
  equipments: number[] // 设备
  allowBooking?: boolean // 允许预定
  needApproval?: boolean // 需要审批
  bookingScope?: number // 预定范围
  bookingUserIds: number[] // 指定成员
  sort?: number // 排序
  remark?: string // 备注
  fileUrls: string[] // 附件
  createTime?: string // 创建时间
}

// 查询会议室分页
export const getMeetingRoomPage = (params: PageParam) => {
  return request.get({ url: '/oa/meeting-room/page', params })
}

// 查询会议室详情
export const getMeetingRoom = (id: number) => {
  return request.get({ url: '/oa/meeting-room/get', params: { id } })
}

// 新增会议室
export const createMeetingRoom = (data: MeetingRoomVO) => {
  return request.post({ url: '/oa/meeting-room/create', data })
}

// 修改会议室
export const updateMeetingRoom = (data: MeetingRoomVO) => {
  return request.put({ url: '/oa/meeting-room/update', data })
}

// 删除会议室
export const deleteMeetingRoom = (id: number) => {
  return request.delete({ url: '/oa/meeting-room/delete', params: { id } })
}

// 查询可预定的会议室分页
export const getBookableMeetingRoomPage = (params: PageParam) => {
  return request.get({ url: '/oa/meeting-room/bookable-page', params })
}
