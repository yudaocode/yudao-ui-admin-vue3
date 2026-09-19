import request from '@/config/axios'

// PMS 工作项评论 VO
export interface PmsWorkItemCommentVO {
  id?: number // 评论编号
  workItemId: number // 工作项编号
  userId?: number // 评论人用户编号
  userName?: string // 评论人姓名
  mainId?: number // 主评论编号
  replyUserId?: number // 回复对象用户编号
  replyUserName?: string // 回复对象姓名
  content: string // 评论内容
  children?: PmsWorkItemCommentVO[] // 回复列表
  createTime?: number // 创建时间
}

// 查询工作项评论列表
export const getWorkItemCommentList = (workItemId: number) => {
  return request.get<PmsWorkItemCommentVO[]>({
    url: '/pms/pm/work-item-comment/list',
    params: { workItemId }
  })
}

// 新增工作项评论
export const createWorkItemComment = (data: PmsWorkItemCommentVO) => {
  return request.post({ url: '/pms/pm/work-item-comment/create', data })
}

// 修改工作项评论
export const updateWorkItemComment = (data: PmsWorkItemCommentVO) => {
  return request.put({ url: '/pms/pm/work-item-comment/update', data })
}

// 删除工作项评论
export const deleteWorkItemComment = (id: number) => {
  return request.delete({ url: '/pms/pm/work-item-comment/delete', params: { id } })
}
