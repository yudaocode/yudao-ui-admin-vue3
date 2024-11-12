import { MessageRole, ContentType, SendStatus } from '@/views/chat/types/types'
import BaseMessage from './BaseMessage'

export default class ImageMessage extends BaseMessage {
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
      ContentType.IMAGE,
      conversationId,
      receiverId,
      conversationType,
      conversationUserId
    )
    this.content = content
  }
}
