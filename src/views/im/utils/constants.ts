/** IM 消息类型枚举（对齐后端 ImMessageTypeEnum） */
export const ImMessageType = {
  TEXT: 0, // 文本
  IMAGE: 1, // 图片
  FILE: 2, // 文件
  VOICE: 3, // 语音
  VIDEO: 4, // 视频
  RECALL: 10, // 撤回
  READ: 11, // 已读
  RECEIPT: 12, // 回执
  TIP_TIME: 20, // 时间分隔线（前端本地生成，不发送到后端）
  TIP_TEXT: 21, // 提示文本（撤回提示等）
  FRIEND_ADD: 100, // 好友添加
  FRIEND_DELETE: 101, // 好友删除
  FRIEND_UPDATE: 102, // 好友更新（客户端收到后自行拉取）
  GROUP_CREATE: 200, // 群创建
  GROUP_UPDATE: 201, // 群信息变更
  GROUP_DELETE: 202, // 群删除（解散 / 退群 / 踢出均用此类型）
  GROUP_MEMBER_UPDATE: 203 // 群成员信息变更（客户端收到后自行拉取）
} as const

/** IM 普通消息类型集合（聊天气泡中显示，并作为会话最后一条摘要） */
const ImMessageTypeNormals: number[] = [
  ImMessageType.TEXT,
  ImMessageType.IMAGE,
  ImMessageType.FILE,
  ImMessageType.VOICE,
  ImMessageType.VIDEO
]

/** 判断是否"普通消息" */
export function isNormalMessage(type: number): boolean {
  return ImMessageTypeNormals.includes(type)
}

/**
 * IM 消息状态枚举（对齐后端 ImMessageStatusEnum，前端扩展 SENDING + FAILED）
 *
 * 生命周期：FAILED(-2) → SENDING(-1) → UNREAD(0) → READ(3) / RECALL(2)
 */
export const ImMessageStatus = {
  FAILED: -2, // 发送失败（前端独有）
  SENDING: -1, // 发送中（前端独有）
  UNREAD: 0, // 未读
  RECALL: 2, // 已撤回
  READ: 3 // 已读
} as const

/** IM 会话类型枚举 */
export const ImChatType = {
  PRIVATE: 1, // 私聊
  GROUP: 2 // 群聊
} as const

/** IM WebSocket 外层事件类型（对齐后端 ImPrivateMessageDTO.TYPE / ImGroupMessageDTO.TYPE） */
export const ImWsEventType = {
  PRIVATE_MESSAGE: 'im-private-message', // 私聊通道
  GROUP_MESSAGE: 'im-group-message' // 群聊通道
} as const

/** IM 群回执状态枚举（对齐后端 ImGroupMessageReceiptStatusEnum） */
export const ImGroupReceiptStatus = {
  NO_RECEIPT: 0, // 不需要回执
  PENDING: 1, // 待完成
  DONE: 2 // 已完成
} as const

/** 每次拉取私聊消息的最大条数（后端上限 1000，前端取保守值 100） */
export const PRIVATE_MESSAGE_PULL_SIZE = 100

/** 每次拉取群聊消息的最大条数（后端上限 1000，前端取保守值 100） */
export const GROUP_MESSAGE_PULL_SIZE = 100
