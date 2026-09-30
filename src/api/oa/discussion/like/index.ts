import request from '@/config/axios'

// 点赞讨论或主回复
export const createDiscussionLike = (discussionId?: number, replyId?: number) => {
  return request.post({ url: '/oa/discussion-like/create', data: { discussionId, replyId } })
}

// 取消讨论或主回复点赞
export const deleteDiscussionLike = (discussionId?: number, replyId?: number) => {
  return request.delete({ url: '/oa/discussion-like/delete', params: { discussionId, replyId } })
}
