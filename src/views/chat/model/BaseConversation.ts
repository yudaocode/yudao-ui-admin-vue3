import { ConversationType, MessageModelType } from '../types'

export default class BaseConversation {
  public id: string
  public avatar: string
  public name: string
  public description: string
  public createTime: number
  public updateTime: number
  public unreadMessagesCount: number
  public msgList: Array<MessageModelType>
  public type: ConversationType
  public targetId: number
  public senderId: number
  public conversationNo: string
  public lastMessageDescription: string

  constructor(
    id: string,
    avatar: string,
    name: string,
    lastMessageDescription: string,
    createTime: number,
    updateTime: number,
    unreadMessagesCount: number,
    msgList: Array<MessageModelType>,
    type: ConversationType,
    targetId: number,
    senderId: number,
    conversationNo: string
  ) {
    this.id = id
    this.avatar = avatar
    this.name = name
    this.lastMessageDescription = lastMessageDescription
    this.createTime = createTime
    this.updateTime = updateTime
    this.unreadMessagesCount = unreadMessagesCount
    this.msgList = msgList
    this.type = type
    this.targetId = targetId
    this.senderId = senderId
    this.conversationNo = conversationNo
  }
}
