import BaseConversation from './BaseConversation'
import BaseMessage from './BaseMessage'

export class ChatConversation extends BaseConversation {
  constructor(
    id: string,
    avatar: string,
    name: string,
    descrition: string,
    createTime: number,
    updateTime: number,
    unreadCount: number,
    msgList: Array<BaseMessage>,
    type: number,
    targetId: number
  ) {
    super(
      id,
      avatar,
      name,
      descrition,
      createTime,
      updateTime,
      unreadCount,
      msgList,
      type,
      targetId
    )
  }
}
