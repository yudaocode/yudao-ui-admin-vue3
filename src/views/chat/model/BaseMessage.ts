import { MessageRole, ContentType, SendStatus } from '../types'

export default class BaseMessage {
  id?: string
  avatar?: string
  nickname?: string
  createTime: number
  isRead: boolean
  role: MessageRole
  sendStatus: SendStatus
  contentType: ContentType
  conversationId: string
  clientMessageId: string
  receiverId: number
  conversationType: number
  conversationUserId: number
  constructor(
    id: string,
    avatar: string,
    nickname: string,
    createTime: number,
    isRead: boolean,
    role: MessageRole,
    sendStauts: SendStatus,
    contentType: ContentType,
    conversationId: string,
    receiverId: number,
    conversationType: number,
    conversationUserId: number
  ) {
    this.id = id
    this.avatar = avatar
    this.nickname = nickname
    this.createTime = createTime
    this.isRead = isRead
    this.role = role
    this.sendStatus = sendStauts
    this.contentType = contentType
    this.conversationId = conversationId
    this.receiverId = receiverId
    this.clientMessageId = this.generateClientMessageId()
    this.conversationType = conversationType
    this.conversationUserId = conversationUserId
  }

  private generateClientMessageId() {
    const timestamp = Date.now().toString() // 获取当前时间戳
    const randomPart = 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })

    return `${timestamp}-${randomPart}`
  }
}
