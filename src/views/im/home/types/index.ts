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
  unreadCount: number // 未读数
  messages: Message[] // 消息列表

  // ========== 最后一条消息事实索引 ==========
  lastContent: string // 会话列表展示的最后一条消息摘要
  lastSendTime: number // 最后一条消息时间，用于排序
  lastSenderId?: number // 发送人编号
  lastMessageType?: number // 消息类型，对齐 ImMessageType
  lastSelfSend?: boolean // 是否自己发的
  lastSenderDisplayName?: string // 发送人显示名快照——仅作 utils/user.getSenderDisplayName 实时算不出真名时的 fallback

  // ========== UI 状态 ==========
  deleted?: boolean // 是否已删除（软删标记，持久化时过滤）
  top?: boolean // 是否置顶（排序时优先）
  silent?: boolean // 是否免打扰（不展示未读徽标 + 不响提示音）
  atMe?: boolean // 群聊：是否有人 @我
  atAll?: boolean // 群聊：是否有人 @全体成员
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
  // 发送人显示名一律渲染时实时算：utils/user.getSenderDisplayName / getSenderRealNickname
  // 不在 Message 上存任何名字快照，避免备注 / 群昵称变更后历史消息显示陈旧
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
  pinnedMessages?: Message[] // 群置顶消息列表

  // ========== 前端扩展字段（user-per-group 维度） ==========
  silent?: boolean // 是否免打扰。从当前用户的 GroupMember 回填
  groupRemark?: string // 群备注。从当前用户的 GroupMember 回填（当前用户对该群的自定义名）
  members?: GroupMember[] // 群成员缓存（按需懒加载）
  membersLoaded?: boolean // members 是否"完整加载"——只有整群 loadGroupMembers / fetchGroupMembers 命中时为 true；fetchGroupMember 单成员补齐不置位，避免 fetchGroupMembers(force=false) 命中缓存时误判整群已加载
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
  displayUserName?: string // 该成员在群内自定义昵称（每个 member 一份；不与 nickname 合并，由消费方按需取舍）
  status?: number // 在群 / 退群状态，对齐 CommonStatusEnum
  role?: number // 成员角色，参见 ImGroupMemberRole 枚举：1=群主 2=管理员 3=普通成员

  // ========== 前端扩展字段 ==========
  isOwner?: boolean // 是否群主（前端从 Group.ownerUserId 计算）
}

// ==================== 好友 ====================

// 好友实体（前端内部结构）
export interface Friend {
  // ========== 后端字段（对齐 ImFriendRespVO） ==========
  id?: number // 好友关系记录编号（本地乐观新增时可能暂缺）
  friendUserId: number // 好友用户编号（与 Conversation.targetId 对齐）
  nickname: string // 好友昵称（对方真实昵称，永远不被备注覆盖；UI 显示走 displayName || nickname）
  nicknamePinyin?: string // 昵称的拼音（后端用 Pinyin4j 算好回填，小写无空格）
  avatar?: string // 好友头像
  silent?: boolean // 是否免打扰（不展示未读徽标 + 不响提示音）
  displayName?: string // 好友展示备注：仅自己可见的别名（单字段不歧义，不带 Friend 前缀）
  displayNamePinyin?: string // 备注的拼音（后端用 Pinyin4j 算好回填，小写无空格）
  status?: number // 好友状态，对齐 CommonStatusEnum（DISABLE = 已删除，软删保留记录）
  addSource?: number // 添加来源；参见 ImFriendAddSourceEnum
  pinned?: boolean // 是否置顶联系人
  blocked?: boolean // 是否拉黑（仅自己可见，单边屏蔽对方私聊消息）
  addTime?: number // 添加好友时间（毫秒时间戳；后端为 LocalDateTime 字符串，在 convertFriend 转换）
  deleteTime?: number // 删除好友时间（毫秒时间戳；后端为 LocalDateTime 字符串，在 convertFriend 转换）
}

/**
 * 好友申请记录（前端内部结构，对齐后端 ImFriendRequestRespVO）
 */
export interface FriendRequest {
  // ========== 后端字段（对齐 ImFriendRequestRespVO） ==========
  id: number // 申请编号
  fromUserId: number // 发起方用户编号
  toUserId: number // 接收方用户编号
  handleResult: number // 处理结果：0=未处理；1=同意；2=拒绝
  applyContent?: string // 申请理由（发起方填写）
  handleContent?: string // 处理理由（接收方拒绝时可选填）
  addSource?: number // 添加来源；参见 ImFriendAddSourceEnum
  handleTime?: number // 处理时间（毫秒时间戳）
  createTime: number // 申请创建时间（毫秒时间戳）

  // ========== 聚合字段（自 AdminUser，仅展示用） ==========
  fromNickname?: string // 发起方昵称
  fromAvatar?: string // 发起方头像
  toNickname?: string // 接收方昵称
  toAvatar?: string // 接收方头像
}

// ==================== 用户名片 ====================

// 用户精简信息（对齐后端 UserSimpleRespVO，名片 / 头像 hover 等场景共用）
export interface User {
  id: number
  nickname?: string
  avatar?: string
  sex?: number
  deptId?: number
  deptName?: string
}

// ==================== 列表行展示用 Lite 类型 ====================

/**
 * 好友列表行：从 Friend 派生的展示快照
 * - id 用 friendUserId（与列表 click / 选中比对一致），不是 Friend.id（关系记录主键）
 * - deleted 派生自 Friend.status === DISABLE（软删保留），调用方按场景过滤
 */
export interface FriendLite {
  id: number
  nickname: string
  nicknamePinyin?: string // 昵称拼音（用于字母分桶 / 拼音搜索）
  avatar?: string
  displayName?: string
  displayNamePinyin?: string // 备注拼音（优先于 nicknamePinyin 参与分桶）
  deleted?: boolean
}

/**
 * 群列表行：从 Group 派生的展示快照
 * - showGroupName / showImage：调用方决定带不带备注（如个人备注群名）；展示按 show* > 原值兜底
 * - showImageThumb：高频列表用缩略图，避免拉原图阻塞滚动
 */
export interface GroupLite {
  id: number
  name?: string
  showGroupName?: string
  showImage?: string
  showImageThumb?: string
  memberCount?: number
  ownerId?: number
}