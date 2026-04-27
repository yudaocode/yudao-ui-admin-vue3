// ==================== WebSocket 帧 / 事件 ====================

// 后端 WebSocket 统一帧结构：{ type, content }
export interface WebSocketFrame {
  type: string // 帧类型，对齐 ImWebSocketMessageType
  content: string // 帧内容（JSON 字符串）
}

// 私聊消息 DTO（对齐后端 ImPrivateMessageDTO）
export interface ImPrivateMessageDTO {
  id: number // 消息编号
  clientMessageId: string // 客户端消息编号
  senderId: number // 发送人编号
  receiverId: number // 接收人编号
  type: number // 消息类型
  content: string // 消息内容
  status: number // 消息状态
  sendTime: string // 发送时间
}

// 群聊消息 DTO（对齐后端 ImGroupMessageDTO）
export interface ImGroupMessageDTO {
  id: number // 消息编号
  clientMessageId: string // 客户端消息编号
  senderId: number // 发送人编号
  groupId: number // 群编号
  type: number // 消息类型
  content: string // 消息内容
  status: number // 消息状态
  sendTime: string // 发送时间
  atUserIds?: number[] // 群 @ 目标用户列表
  receiverUserIds?: number[] // 群定向接收用户列表
  readCount?: number // 群回执已读人数（type = RECEIPT 时使用）
  receiptStatus?: number // 群回执状态（type = RECEIPT 时使用）
}

// ==================== 本地会话 / 消息结构 ====================

// 会话数据结构（前端自有结构，后端无对应实体）
export interface Conversation {
  // ========== 核心标识 ==========
  targetId: number // 会话目标编号：私聊=对方 userId；群聊=groupId
  type: number // 会话类型，对齐 ImConversationType

  // ========== 展示字段 ==========
  name: string // 展示名称（私聊=好友昵称；群聊=群名）
  avatar: string // 头像
  lastContent: string // 会话列表展示的最后一条消息摘要
  lastSendTime: number // 最后一条消息时间，用于排序
  unreadCount: number // 未读数
  messages: Message[] // 消息列表
  senderNickName?: string // 最后一条消息的发送者昵称（群聊列表前缀展示用）

  // ========== UI 状态 ==========
  deleted?: boolean // 是否已删除（软删标记，持久化时过滤）
  top?: boolean // 是否置顶（排序时优先）
  muted?: boolean // 是否免打扰（不展示未读徽标 + 不响提示音）
  atMe?: boolean // 群聊：是否有人 @我
  atAll?: boolean // 群聊：是否有人 @全体成员
  lastTimeTip?: number // 最后一条"时间分隔线"的时间戳，判断是否需要插入下一条 TIP_TIME
}

// 消息数据结构
export interface Message {
  // ========== 后端字段（对齐 ImPrivateMessageDTO / ImGroupMessageDTO） ==========
  id: number // 服务端消息编号，发送中为 0
  clientMessageId: string // 客户端消息编号，本地生成用于合并去重
  type: number // 消息类型，对齐 ImMessageType
  content: string // 消息内容，JSON 字符串
  status: number // 消息状态，对齐 ImMessageStatus
  sendTime: number // 发送时间（前端转毫秒时间戳；后端为 LocalDateTime 字符串）
  senderId: number // 发送人编号
  atUserIds?: number[] // 群 @ 目标用户列表
  receiverUserIds?: number[] // 群定向接收用户列表
  receiptStatus?: number // 群回执状态，对齐 ImGroupReceiptStatus（仅群消息）
  readCount?: number // 群回执已读人数（仅群消息）

  // ========== 前端扩展字段 ==========
  senderNickName: string // 发送人昵称（前端从 friendStore / groupStore 补全）
  targetId: number // 会话目标编号（私聊=receiverId / 群聊=groupId），与 Conversation.targetId 一致
  selfSend: boolean // 是否自己发送（前端按 senderId 计算）
}

/**
 * 会话索引项：基于 Conversation 派生，但剥离 messages 字段（消息按会话独立存到 messages key）
 *
 * Omit<T, K> 是 TS 内置工具类型：从类型 T 中剔除 K 指定的字段，得到剩余字段组成的新类型。
 * 这里 `Omit<Conversation, 'messages'>` 等价于"Conversation 去掉 messages 字段后的版本"，
 * 与"Conversation 派生但少一个 messages 字段"的语义一致，不需要再手写一份重复结构。
 */
export type ConversationMeta = Omit<Conversation, 'messages'>

// 持久化的会话索引：游标 + 会话元数据列表，按用户 ID 分桶
export interface ConversationStoreMeta {
  privateMessageMaxId: number // 私聊消息最大编号
  groupMessageMaxId: number // 群聊消息最大编号
  conversations: ConversationMeta[] // 会话索引（不含 messages）
}

// ==================== 群 / 群成员 ====================

// 群实体（前端内部结构）
export interface Group {
  // ========== 后端字段（对齐 ImGroupRespVO） ==========
  id: number // 群编号
  name: string // 群名称
  avatar?: string // 群头像
  notice?: string // 群公告
  ownerUserId?: number // 群主用户编号

  // ========== 前端扩展字段 ==========
  muted?: boolean // 是否免打扰（来自当前用户的 ImGroupMemberRespVO.muted）
  members?: GroupMember[] // 群成员缓存（按需懒加载）
  memberCount?: number // 成员总数
}

// 群成员实体（前端内部结构）
export interface GroupMember {
  // ========== 后端字段（对齐 ImGroupMemberRespVO） ==========
  id?: number // 群成员关系记录编号
  groupId: number // 群编号
  userId: number // 用户编号
  avatar?: string // 头像
  nickname: string // 用户昵称
  displayUserName?: string // 组内显示名（不与 nickname 合并，由消费方按需取舍）
  displayGroupName?: string // 群显示备注（当前用户对该群的自定义名）
  status?: number // 在群 / 退群状态，对齐 CommonStatusEnum
  muted?: boolean // 当前成员对该群的免打扰开关（loadGroupMembers 用它回填 Group.muted）

  // ========== 前端扩展字段 ==========
  isOwner?: boolean // 是否群主（前端从 Group.ownerUserId 计算）
}

// ==================== 好友 ====================

// 好友实体（前端内部结构）
export interface Friend {
  // ========== 后端字段（对齐 ImFriendRespVO） ==========
  id?: number // 好友关系记录编号（本地乐观新增时可能暂缺）
  friendUserId: number // 好友用户编号（与 Conversation.targetId 对齐）
  nickname: string // 好友昵称
  avatar?: string // 好友头像
  muted?: boolean // 是否免打扰（不展示未读徽标 + 不响提示音）
  status?: number // 好友状态，对齐 CommonStatusEnum（DISABLE = 已删除，软删保留记录）
  addTime?: number // 添加好友时间（毫秒时间戳；后端为 LocalDateTime 字符串，在 convertFriend 转换）
  deleteTime?: number // 删除好友时间（毫秒时间戳；后端为 LocalDateTime 字符串，在 convertFriend 转换）
}

// ==================== 用户名片 ====================

// 用户精简信息（对齐后端 UserSimpleRespVO，名片 / 头像 hover 等场景共用）
export interface UserInfo {
  id: number
  nickname?: string
  avatar?: string
  sex?: number
  deptId?: number
  deptName?: string
}