/** IM 消息类型枚举（对齐后端 ImMessageTypeEnum） */
export const ImMessageType = {
  // ========== 用户聊天消息（101-105 直接复用 OpenIM 段位编号） ==========
  TEXT: 101, // 文本（对应 OpenIM Text=101）
  IMAGE: 102, // 图片（对应 OpenIM Picture=102）
  VOICE: 103, // 语音（对应 OpenIM Sound=103）
  VIDEO: 104, // 视频（对应 OpenIM Video=104）
  FILE: 105, // 文件（对应 OpenIM File=105）
  CARD: 108, // 名片（对应 OpenIM Card=108）
  FACE: 115, // 表情贴图（对应 OpenIM Face=115；Unicode emoji 仍走 TEXT）
  // ========== 信号类（2101 / 2200 直接复用 OpenIM 段位编号；2201 自有扩展） ==========
  RECALL: 2101, // 撤回（对应 OpenIM RevokeNotification=2101）
  RECEIPT: 2200, // 回执（对应 OpenIM HasReadReceipt=2200）
  READ: 2201, // 已读（多端同步，OpenIM 无对应；自有扩展）
  // ========== 好友通知（1201-1210 直接复用 OpenIM 段位编号） ==========
  FRIEND_REQUEST_APPROVED: 1201, // 好友申请被同意
  FRIEND_REQUEST_REJECTED: 1202, // 好友申请被拒绝
  FRIEND_REQUEST_RECEIVED: 1203, // 收到新的好友申请
  FRIEND_ADD: 1204, // 新增好友（双方建立关系）
  FRIEND_DELETE: 1205, // 好友被删除
  // 1206 对应 OpenIM FriendRemarkSetNotification；本系统并入 FRIEND_UPDATE(1210) 统一推送，单一字段变更不再独立通道
  FRIEND_BLOCK: 1207, // 加入黑名单
  FRIEND_UNBLOCK: 1208, // 移出黑名单
  FRIEND_INFO_UPDATED: 1209, // 好友资料变更（昵称 / 头像）
  FRIEND_UPDATE: 1210, // 好友信息批量更新（silent / pinned）
  // ========== 群事件（1501-1520 直接复用 OpenIM 段位编号；1530+ 自有扩展段） ==========
  GROUP_CREATE: 1501, // 群创建
  GROUP_INFO_UPDATE: 1502, // 群信息变更（NAME / NOTICE 之外字段兜底）
  GROUP_REQUEST_RECEIVED: 1503, // 收到新的入群申请（私聊定向推送给群主 + 全部管理员）
  GROUP_MEMBER_QUIT: 1504, // 成员退群
  GROUP_REQUEST_APPROVED: 1505, // 入群申请被同意（私聊推给申请人 + 群主 + 全部管理员）
  GROUP_REQUEST_REJECTED: 1506, // 入群申请被拒绝（同上）
  GROUP_OWNER_TRANSFER: 1507, // 群主转让
  GROUP_MEMBER_KICK: 1508, // 成员被移出
  GROUP_MEMBER_INVITE: 1509, // 成员加入
  GROUP_MEMBER_ENTER: 1510, // 自由进群（FREE 模式或申请通过后；全员广播）
  GROUP_DISSOLVE: 1511, // 群解散
  GROUP_MEMBER_MUTED: 1512, // 单成员禁言
  GROUP_MEMBER_CANCEL_MUTED: 1513, // 单成员取消禁言
  GROUP_MUTED: 1514, // 全群禁言
  GROUP_CANCEL_MUTED: 1515, // 全群取消禁言
  GROUP_MEMBER_NICKNAME_UPDATE: 1516, // 成员昵称变更（窄化到 displayUserName）
  GROUP_ADMIN_ADD: 1517, // 添加管理员
  GROUP_ADMIN_REMOVE: 1518, // 撤销管理员
  GROUP_NOTICE_UPDATE: 1519, // 群公告变更
  GROUP_NAME_UPDATE: 1520, // 群名变更
  // ========== 自有扩展段（1530+，OpenIM 1500-1520 段位无对应物） ==========
  GROUP_MEMBER_SETTING_UPDATE: 1530, // 群成员个人设置变更：silent / groupRemark 个人多端同步
  GROUP_MESSAGE_PIN: 1531, // 群消息置顶（自有扩展，OpenIM 无）
  GROUP_MESSAGE_UNPIN: 1532, // 群消息取消置顶（自有扩展，OpenIM 无）
  GROUP_BANNED: 1533 // 群封禁变更（自有扩展，OpenIM 无）
} as const

/** 判断是否「群广播事件」：[GROUP_CREATE, GROUP_BANNED] 段位都算，仅 GROUP_MEMBER_SETTING_UPDATE 是个人信号排除 */
export function isGroupNotification(type: number): boolean {
  return (
    type >= ImMessageType.GROUP_CREATE
    && type <= ImMessageType.GROUP_BANNED
    && type !== ImMessageType.GROUP_MEMBER_SETTING_UPDATE
  )
}

/** 判断是否「好友通知事件」：1201-1210 段位 */
export function isFriendNotification(type: number): boolean {
  return type >= ImMessageType.FRIEND_REQUEST_APPROVED && type <= ImMessageType.FRIEND_UPDATE
}

/** 判断是否「加群申请通知事件」：1503/1505/1506 走私聊通道，按段位识别 */
export function isGroupRequestNotification(type: number): boolean {
  return (
    type === ImMessageType.GROUP_REQUEST_RECEIVED
    || type === ImMessageType.GROUP_REQUEST_APPROVED
    || type === ImMessageType.GROUP_REQUEST_REJECTED
  )
}

/** 判断是否「会话内的好友事件气泡」：FRIEND_ADD / FRIEND_DELETE 直接渲染成灰色提示，与群事件同处理 */
export function isFriendChatTip(type: number): boolean {
  return type === ImMessageType.FRIEND_ADD || type === ImMessageType.FRIEND_DELETE
}

/**
 * IM 普通消息类型集合（normal vs event 二分；与后端 ImMessageTypeEnum.normal 字段语义一致）
 *
 * 这个集合在多处被复用，新增类型前先确认所有副作用都符合预期：
 * 1. 后端发送入口校验（Im{Private,Group}MessageSendReqVO.isNormalType）—— 用户发送的消息类型必须 normal=true
 * 2. 前端接收侧未读 / 提示音（websocketStore）—— normal 消息计入会话未读数 + 触发声音
 * 3. 前端会话列表 lastType / @ 标签（ConversationItem）—— 只有 normal 才算「最后一条聊天消息」
 * 4. 前端群消息置顶菜单（MessageItem.vue 的 canPin）—— normal 才允许群主 / 管理员置顶
 *
 * 名片（CARD）/ 表情（FACE）都是「用户主动发的聊天消息」，1/2/3 都符合预期；4 同时放开 = 群主可置顶，语义合理
 */
const ImMessageTypeNormals: number[] = [
  ImMessageType.TEXT,
  ImMessageType.IMAGE,
  ImMessageType.FILE,
  ImMessageType.VOICE,
  ImMessageType.VIDEO,
  ImMessageType.CARD,
  ImMessageType.FACE
]

/** 判断是否"普通消息" */
export function isNormalMessage(type: number): boolean {
  return ImMessageTypeNormals.includes(type)
}

/** IM 媒体消息类型集合：发送依赖本地 File 上传，刷新后 _localFile 丢失即不可恢复 */
const ImMessageTypeMedia: number[] = [
  ImMessageType.IMAGE,
  ImMessageType.FILE,
  ImMessageType.VOICE,
  ImMessageType.VIDEO
]

/** 判断是否「媒体消息」：图片 / 文件 / 语音 / 视频 */
export function isMediaMessageType(type: number): boolean {
  return ImMessageTypeMedia.includes(type)
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

/** 加群来源（对齐后端 ImGroupAddSourceEnum） */
export const ImGroupAddSource = {
  SEARCH: 1, // 搜索
  INVITE: 2, // 邀请
  QR_CODE: 3, // 扫码
  SHARE_LINK: 4 // 分享链接
} as const

/** 加群申请处理结果（对齐后端 ImGroupRequestHandleResultEnum） */
export const ImGroupRequestHandleResult = {
  UNHANDLED: 0, // 未处理
  AGREED: 1, // 同意
  REFUSED: 2 // 拒绝
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

/** 「我相关」好友申请列表的单次拉取条数（游标分页 page size，前端控制） */
export const FRIEND_REQUEST_PAGE_SIZE = 100

/** 「我相关」加群申请列表的单次拉取条数 */
export const GROUP_REQUEST_PAGE_SIZE = 100

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
