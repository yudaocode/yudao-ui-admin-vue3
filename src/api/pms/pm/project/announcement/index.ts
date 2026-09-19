import request from '@/config/axios'

// PMS 项目公告 VO
export interface PmsProjectAnnouncementVO {
  id: number // 公告编号
  projectId: number // 项目编号
  content: string // 公告内容
  fileUrls: string[] // 附件地址列表
  creatorUserId: number // 创建者用户编号
  creatorUserName?: string // 创建者用户昵称
  createTime: number // 创建时间
  updateTime: number // 更新时间
}

// 查询项目公告列表
export const getProjectAnnouncementList = (projectId: number) => {
  return request.get<PmsProjectAnnouncementVO[]>({
    url: '/pms/pm/project-announcement/list',
    params: { projectId }
  })
}

// 查询项目公告详情
export const getProjectAnnouncement = (id: number) => {
  return request.get<PmsProjectAnnouncementVO>({
    url: '/pms/pm/project-announcement/get',
    params: { id }
  })
}

// 新增项目公告
export const createProjectAnnouncement = (data: PmsProjectAnnouncementVO) => {
  return request.post({ url: '/pms/pm/project-announcement/create', data })
}

// 修改项目公告
export const updateProjectAnnouncement = (data: PmsProjectAnnouncementVO) => {
  return request.put({ url: '/pms/pm/project-announcement/update', data })
}

// 删除项目公告
export const deleteProjectAnnouncement = (id: number) => {
  return request.delete({ url: '/pms/pm/project-announcement/delete', params: { id } })
}
