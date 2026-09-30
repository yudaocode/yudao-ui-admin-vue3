import request from '@/config/axios'

export interface OaDiscussionReplyVO {
  id?: number // 回复编号
  discussionId: number // 讨论编号
  userId?: number // 回复人用户编号
  userName?: string // 回复人用户昵称
  parentId?: number // 父回复编号
  replyUserId?: number // 被回复人用户编号
  replyUserName?: string // 被回复人用户昵称
  content: string // 回复内容
  likeCount?: number // 点赞数
  liked?: boolean // 当前用户是否已点赞
  likeUserNames?: string[] // 点赞人用户昵称列表
  createTime?: string // 创建时间
  children?: OaDiscussionReplyVO[] // 楼层内的子回复
}

// 查询讨论回复分页
export const getDiscussionReplyPage = (params: PageParam) => {
  return request.get<PageResult<OaDiscussionReplyVO[]>>({
    url: '/oa/discussion-reply/page',
    params
  })
}

// 新增讨论回复
export const createDiscussionReply = (data: OaDiscussionReplyVO) => {
  return request.post({ url: '/oa/discussion-reply/create', data })
}

// 删除讨论回复
export const deleteDiscussionReply = (id: number) => {
  return request.delete({ url: '/oa/discussion-reply/delete', params: { id } })
}
