import request from '@/config/axios'

export interface OaAnnouncementVO {
  id?: number // 公告编号
  publisherUserId?: number // 发布人用户编号
  publisherUserName?: string // 发布人用户昵称
  publisherDeptId?: number // 发布人部门编号
  publisherDeptName?: string // 发布人部门名称
  type: number // 公告类型
  priority: number // 优先级
  title: string // 公告标题
  content?: string // 公告内容
  url?: string // 相关链接
  top: boolean // 是否置顶
  receiverUserIds?: number[] // 接收人用户编号列表
  receiverUserNames?: string[] // 接收人用户昵称列表
  readStatus?: boolean // 当前接收人是否已读
  forwarded?: boolean // 当前接收人是否已转发给下属
  createTime?: string // 创建时间
}

// 查询我发布的公告分页
export const getPublishedAnnouncementPage = (params: PageParam) => {
  return request.get({ url: '/oa/announcement/published-page', params })
}

// 查询接收的公告分页
export const getReceivedAnnouncementPage = (params: PageParam) => {
  return request.get({ url: '/oa/announcement/received-page', params })
}

// 查询公告详情
export const getAnnouncement = (id: number) => {
  return request.get({ url: '/oa/announcement/get', params: { id } })
}

// 新增公告
export const createAnnouncement = (data: OaAnnouncementVO) => {
  return request.post({ url: '/oa/announcement/create', data })
}

// 修改公告
export const updateAnnouncement = (data: OaAnnouncementVO) => {
  return request.put({ url: '/oa/announcement/update', data })
}

// 删除发布的公告
export const deleteAnnouncement = (id: number) => {
  return request.delete({ url: '/oa/announcement/delete', params: { id } })
}

// 删除接收的公告
export const deleteReceivedAnnouncement = (id: number) => {
  return request.delete({ url: '/oa/announcement/delete-received', params: { id } })
}

// 标记公告为已读
export const updateAnnouncementReadStatus = (id: number) => {
  return request.put({ url: '/oa/announcement/update-read-status', params: { id } })
}

// 转发公告给直属下属
export const forwardAnnouncement = (id: number) => {
  return request.post({ url: '/oa/announcement/forward', params: { id } })
}
