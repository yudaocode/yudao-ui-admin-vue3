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
  TIP_TEXT: 21, // 提示文本（撤回提示等）
  // 好友通知（1201-1210 复用 OpenIM 段位编号）
  FRIEND_REQUEST_APPROVED: 1201, // 好友申请被同意
  FRIEND_REQUEST_REJECTED: 1202, // 好友申请被拒绝
  FRIEND_APPLICATION: 1203, // 收到新的好友申请
  FRIEND_ADD: 1204, // 新增好友（双方建立关系）
  FRIEND_DELETE: 1205, // 好友被删除
  // 1206 对应 OpenIM FriendRemarkSetNotification；本系统并入 FRIEND_UPDATE(1210) 统一推送
  FRIEND_BLOCK: 1207, // 加入黑名单
  FRIEND_UNBLOCK: 1208, // 移出黑名单
  FRIEND_INFO_UPDATED: 1209, // 好友资料变更（昵称 / 头像）
  FRIEND_UPDATE: 1210, // 好友信息批量更新（muted / pinned）
  // 群事件（1501-1520 复用 OpenIM 段位编号；1530+ 自有扩展段）
  GROUP_CREATE: 1501, // 群创建
  GROUP_INFO_UPDATE: 1502, // 群信息变更（NAME / NOTICE 之外字段兜底）
  // 1503 GROUP_JOIN_APPLICATION TODO 未实现：入群申请
  GROUP_MEMBER_QUIT: 1504, // 成员退群
  // 1505 GROUP_APPLICATION_ACCEPTED TODO 未实现：入群申请通过
  // 1506 GROUP_APPLICATION_REJECTED TODO 未实现：入群申请拒绝
  GROUP_OWNER_TRANSFER: 1507, // 群主转让
  GROUP_MEMBER_KICK: 1508, // 成员被移出
  GROUP_MEMBER_INVITE: 1509, // 成员加入
  // 1510 GROUP_MEMBER_ENTER TODO 未实现：自由进群
  GROUP_DISSOLVE: 1511, // 群解散
  // 1512 GROUP_MEMBER_MUTED TODO 未实现：单成员禁言
  // 1513 GROUP_MEMBER_CANCEL_MUTED TODO 未实现：单成员取消禁言
  // 1514 GROUP_MUTED TODO 未实现：全群禁言
  // 1515 GROUP_CANCEL_MUTED TODO 未实现：全群取消禁言
  GROUP_MEMBER_NICKNAME_UPDATE: 1516, // 成员昵称变更（窄化到 displayUserName）
  GROUP_ADMIN_ADD: 1517, // 添加管理员
  GROUP_ADMIN_REMOVE: 1518, // 撤销管理员
  GROUP_NOTICE_UPDATE: 1519, // 群公告变更
  GROUP_NAME_UPDATE: 1520, // 群名变更
  GROUP_MEMBER_SETTING_UPDATE: 1530, // 群成员个人设置变更：muted / groupRemark 个人多端同步
  GROUP_MESSAGE_PIN: 1531, // 群消息置顶
  GROUP_MESSAGE_UNPIN: 1532 // 群消息取消置顶
} as const

/** 判断是否「群广播事件」：[GROUP_CREATE, GROUP_MESSAGE_UNPIN] 段位都算，仅 GROUP_MEMBER_SETTING_UPDATE 是个人信号排除 */
export function isGroupNotification(type: number): boolean {
  return (
    type >= ImMessageType.GROUP_CREATE
    && type <= ImMessageType.GROUP_MESSAGE_UNPIN
    && type !== ImMessageType.GROUP_MEMBER_SETTING_UPDATE
  )
}

/** 判断是否「好友通知事件」：1201-1210 段位 */
export function isFriendNotification(type: number): boolean {
  return type >= ImMessageType.FRIEND_REQUEST_APPROVED && type <= ImMessageType.FRIEND_UPDATE
}

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
export const ImConversationType = {
  PRIVATE: 1, // 私聊
  GROUP: 2 // 群聊
} as const

/** IM WebSocket 外层帧类型（对齐后端 ImPrivateMessageDTO.TYPE / ImGroupMessageDTO.TYPE） */
export const ImWebSocketMessageType = {
  PRIVATE_MESSAGE: 'im-private-message', // 私聊通道
  GROUP_MESSAGE: 'im-group-message' // 群聊通道
} as const

/** IM 群回执状态枚举（对齐后端 ImGroupMessageReceiptStatusEnum） */
export const ImGroupReceiptStatus = {
  NO_RECEIPT: 0, // 不需要回执
  PENDING: 1, // 待完成
  DONE: 2 // 已完成
} as const

/** 群成员角色（对齐后端 ImGroupMemberRoleEnum） */
export const ImGroupMemberRole = {
  OWNER: 1, // 群主
  ADMIN: 2, // 管理员
  NORMAL: 3 // 普通成员
} as const

/** 好友添加来源（对齐后端 ImFriendAddSourceEnum） */
export const ImFriendAddSource = {
  SEARCH: 1, // 搜索
  GROUP: 2, // 群聊
  QR_CODE: 3, // 扫码
  CARD: 4 // 名片
} as const

/** 好友申请处理结果（对齐后端 ImFriendRequestHandleResultEnum） */
export const ImFriendRequestHandleResult = {
  UNHANDLED: 0, // 未处理
  AGREED: 1, // 同意
  REFUSED: 2 // 拒绝
} as const

/** 群管理员人数上限（对齐后端 GROUP_ADMIN_MAX_COUNT） */
export const GROUP_ADMIN_MAX_COUNT = 3

/** 群置顶消息条数上限（对齐后端 GROUP_PIN_MAX_COUNT） */
export const GROUP_PIN_MAX_COUNT = 5

/** 每次拉取私聊消息的最大条数（后端上限 1000，前端取保守值 100） */
export const PRIVATE_MESSAGE_PULL_SIZE = 100

/** 每次拉取群聊消息的最大条数（后端上限 1000，前端取保守值 100） */
export const GROUP_MESSAGE_PULL_SIZE = 100

/** 消息之间渲染「时间分隔条」的阈值：10 分钟 */
export const TIME_TIP_GAP_MS = 10 * 60 * 1000

/**
 * @全体成员 的特殊 userId 标识：atUserIds 中包含 -1 表示 @ 全体成员
 *
 * 与后端约定：群消息 atUserIds 数组里出现 -1 时，所有成员都收到提醒
 * MentionPicker 渲染虚拟项 + conversationStore.applyAt 判定 atAll 都靠这个值
 */
export const IM_AT_ALL_USER_ID = -1

/** @全体成员 的展示名（对齐微信 PC） */
export const IM_AT_ALL_NICKNAME = '所有人'
