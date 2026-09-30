import request from '@/config/axios'
import type { OaVoteOptionVO } from './vote'

export interface OaDiscussionVO {
  id?: number // 讨论编号
  userId?: number // 发布人用户编号
  userName?: string // 发布人用户昵称
  type: number // 讨论类型
  title: string // 标题
  content?: string // 内容
  fileUrls: string[] // 附件地址列表
  visitCount?: number // 访问次数
  replyCount?: number // 回复数
  likeCount?: number // 点赞数
  liked?: boolean // 当前用户是否已点赞
  likeUserNames?: string[] // 点赞人用户昵称列表
  voteMultiple?: boolean // 投票是否允许多选
  voteStartTime?: string // 投票开始时间
  voteEndTime?: string // 投票结束时间
  voteOptions?: OaVoteOptionVO[] // 投票选项列表
  createTime?: string // 创建时间
}

// 查询讨论分页
export const getDiscussionPage = (params: PageParam) => {
  return request.get<PageResult<OaDiscussionVO[]>>({ url: '/oa/discussion/page', params })
}

// 查询管理范围内的讨论分页
export const getDiscussionManagePage = (params: PageParam) => {
  return request.get<PageResult<OaDiscussionVO[]>>({ url: '/oa/discussion/manage-page', params })
}

// 查询讨论详情
export const getDiscussion = (id: number, visit = false) => {
  return request.get({ url: '/oa/discussion/get', params: { id, visit } })
}

// 新增讨论
export const createDiscussion = (data: OaDiscussionVO) => {
  return request.post({ url: '/oa/discussion/create', data })
}

// 修改讨论
export const updateDiscussion = (data: OaDiscussionVO) => {
  return request.put({ url: '/oa/discussion/update', data })
}

// 删除讨论
export const deleteDiscussion = (id: number) => {
  return request.delete({ url: '/oa/discussion/delete', params: { id } })
}
