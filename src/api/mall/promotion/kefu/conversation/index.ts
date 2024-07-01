import request from '@/config/axios'

export interface KeFuConversationRespVO {
  /**
   * 编号
   */
  id: number
  /**
   * 会话所属用户
   */
  userId: number
  /**
   * 会话所属用户头像
   */
  userAvatar: string
  /**
   * 会话所属用户昵称
   */
  userNickname: string
  /**
   * 最后聊天时间
   */
  lastMessageTime: Date
  /**
   * 最后聊天内容
   */
  lastMessageContent: string
  /**
   * 最后发送的消息类型
   */
  lastMessageContentType: number
  /**
   * 管理端置顶
   */
  adminPinned: boolean
  /**
   * 用户是否可见
   */
  userDeleted: boolean
  /**
   * 管理员是否可见
   */
  adminDeleted: boolean
  /**
   * 管理员未读消息数
   */
  adminUnreadMessageCount: number
  /**
   * 创建时间
   */
  createTime?: string
}

// 客服会话 API
export const KeFuConversationApi = {
  // 获得客服会话列表
  getConversationList: async () => {
    return await request.get({ url: '/promotion/kefu-conversation/list' })
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
    return await request.get({ url: '/promotion/kefu-conversation/delete?id' + id })
  }
}
