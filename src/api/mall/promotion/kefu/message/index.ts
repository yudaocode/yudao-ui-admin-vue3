import request from '@/config/axios'

export interface KeFuMessageRespVO {
  /**
   * 编号
   */
  id: number
  /**
   * 会话编号
   */
  conversationId: number
  /**
   * 发送人编号
   */
  senderId: number
  /**
   * 发送人头像
   */
  senderAvatar: string
  /**
   * 发送人类型
   */
  senderType: number
  /**
   * 接收人编号
   */
  receiverId: number
  /**
   * 接收人类型
   */
  receiverType: number
  /**
   * 消息类型
   */
  contentType: number
  /**
   * 消息
   */
  content: string
  /**
   * 是否已读
   */
  readStatus: boolean
  /**
   * 创建时间
   */
  createTime: Date
}

// 客服会话 API
export const KeFuMessageApi = {
  // 发送客服消息
  sendKeFuMessage: async (data: any) => {
    return await request.put({
      url: '/promotion/kefu-message/send',
      data
    })
  },
  // 更新客服消息已读状态
  updateKeFuMessageReadStatus: async (data: any) => {
    return await request.put({
      url: '/promotion/kefu-message/update-read-status',
      data
    })
  },
  // 获得消息分页数据
  getKeFuMessagePage: async (params: any) => {
    return await request.get({ url: '/promotion/kefu-message/page', params })
  }
}
