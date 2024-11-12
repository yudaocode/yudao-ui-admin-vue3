import { MessageRole, ContentType, SendStatus, ImMessageContent } from '@/views/chat/types/types'
import BaseMessage from './BaseMessage'

export default class TextMessage extends BaseMessage {
  content: string

  constructor(
    id: string,
    avatar: string,
    nickname: string,
    createTime: number,
    isRead: boolean,
    content: string,
    role: MessageRole,
    sendStatus: SendStatus,
    conversationId: string,
    senderId: number,
    receiverId: number,
    conversationType: number,
    conversationUserId: number
  ) {
    super(
      id,
      avatar,
      nickname,
      createTime,
      isRead,
      role,
      sendStatus,
      ContentType.TEXT,
      conversationId,
      senderId,
      receiverId,
      conversationType,
      conversationUserId
    )
    this.content = content
  }

  /**
   * 消息转换
   * @param websocketMessage 
   * @returns 
   */
  static fromWebsocket(websocketMessage: ImMessageContent): TextMessage {
    return new TextMessage(
      websocketMessage.id.toString(), // 服务端也应该返回一个clientMessageId
      websocketMessage.senderAvatar,
      websocketMessage.senderNickname,
      new Date().getTime(), // TODO: 是否合理
      false,
      websocketMessage.content,
      MessageRole.OTHER, // 可以去掉在使用的时候依据逻辑判断
      SendStatus.SUCCESS,
      '',   // TODO: [dylan] 
      websocketMessage.senderId,
      websocketMessage.receiverId,
      websocketMessage.conversationType,
      0
    )
  }
}
