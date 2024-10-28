import BaseConversation from './BaseConversation'
import BaseMessage from './BaseMessage'

// TODO @dylan：这些 ts 类，是不是可以搞个 types.ts，然后放到 api/im 目录下？放在一个文件里

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
