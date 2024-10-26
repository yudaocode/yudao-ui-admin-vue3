import BaseConversation from './BaseConversation'
import BaseMessage from './BaseMessage'

export class ChatConversation extends BaseConversation {
  constructor(
    id: string,
    avatar: string,
    name: string,
    lastMessageDescription: string,
    createTime: number,
    updateTime: number,
    unreadMessagesCount: number,
    msgList: Array<BaseMessage>,
    type: number,
    targetId: number,
    senderId: number,
    conversationNo: string
  ) {
    super(
      id,
      avatar,
      name,
      lastMessageDescription,
      createTime,
      updateTime,
      unreadMessagesCount,
      msgList,
      type,
      targetId,
      senderId,
      conversationNo
    )
  }
}
