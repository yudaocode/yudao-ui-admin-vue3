import request from '@/config/axios'

export interface KeFuConversationRespVO {
  id: number // 编号
  userId: number // 会话所属用户
  userAvatar: string // 会话所属用户头像
  userNickname: string // 会话所属用户昵称
  lastMessageTime: Date // 最后聊天时间
  lastMessageContent: string // 最后聊天内容
  lastMessageContentType: number // 最后发送的消息类型
  adminPinned: boolean // 管理端置顶
  userDeleted: boolean // 用户是否可见
  adminDeleted: boolean // 管理员是否可见
  adminUnreadMessageCount: number // 管理员未读消息数
  createTime?: string // 创建时间
}

// 客服会话 API
export const KeFuConversationApi = {
  // 获得客服会话列表
  getConversationList: async () => {
    return await request.get({ url: '/promotion/kefu-conversation/list' })
  },
  // 获得客服会话
  getConversation: async (id: number) => {
    return await request.get({ url: `/promotion/kefu-conversation/get?id=` + id })
  },
  // 客服会话置顶
  updateConversationPinned: async (data: any) => {
    return await request.put({
      url: '/promotion/kefu-conversation/update-conversation-pinned',
      data
    })
  },
  // 删除客服会话
  deleteConversation: async (id: number) => {
    return await request.delete({ url: `/promotion/kefu-conversation/delete?id=${id}` })
  }
}
