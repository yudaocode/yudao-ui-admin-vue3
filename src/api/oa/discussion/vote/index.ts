import request from '@/config/axios'

export interface OaVoteOptionVO {
  id?: number // 投票选项编号
  title: string // 选项标题
  color?: string // 选项颜色
  sort: number // 显示顺序
  voteCount?: number // 投票数
  voted?: boolean // 当前用户是否已选择
  voterUserNames?: string[] // 投票人用户昵称列表
}

// 参与讨论投票
export const voteDiscussion = (discussionId: number, optionIds: number[]) => {
  return request.post({ url: '/oa/discussion-vote/create', data: { discussionId, optionIds } })
}
