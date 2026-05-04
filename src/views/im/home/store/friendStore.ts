import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import { CommonStatusEnum } from '@/utils/constants'
import {
  getMyFriendList as apiGetMyFriendList,
  getFriend as apiGetFriend,
  deleteFriend as apiDeleteFriend,
  updateFriend as apiUpdateFriend,
  type ImFriendRespVO
} from '@/api/im/friend'
import {
  applyFriendRequest as apiApplyFriendRequest,
  agreeFriendRequest as apiAgreeFriendRequest,
  refuseFriendRequest as apiRefuseFriendRequest,
  getMyFriendRequestList as apiGetMyFriendRequestList,
  type ImFriendRequestApplyReqVO,
  type ImFriendRequestRespVO
} from '@/api/im/friend/request'
import { useConversationStore } from './conversationStore'
import { ImConversationType } from '../../utils/constants'
import { getCurrentUserId, imStorage, setQuietly, StorageKeys } from '../../utils/storage'
import { getFriendDisplayName } from '../../utils/user'
import type { Friend, FriendRequest } from '../types'

/** 好友申请处理结果（对齐后端 ImFriendRequestHandleResultEnum） */
const FriendRequestHandleResult = {
  UNHANDLED: 0,
  AGREED: 1,
  REFUSED: 2
} as const

/** 好友通知 payload（对齐后端 BaseFriendNotification + 子类裁减后的字段） */
export interface FriendNotificationPayload {
  operatorUserId: number
  friendUserId: number
  // FRIEND_APPLICATION 系列：申请记录的核心字段（避免 payload 携带完整 DO）
  requestId?: number
  applyContent?: string
  handleContent?: string
  addSource?: number
  // FRIEND_UPDATE：单边属性变更
  displayName?: string
  muted?: boolean
  pinned?: boolean
}

/**
 * IM 好友 Store
 *
 * 负责：
 * - 拉取 / 缓存当前登录用户的好友列表 + 申请列表
 * - 申请-审批流程（apply / agree / refuse）+ 备注 / 免打扰 / 联系人置顶 / 拉黑
 * - 接收 WebSocket 1201-1210 段位通知，按事件分发到 friendStore 内部各 dispatcher
 */
export const useFriendStore = defineStore('imFriendStore', {
  state: () => ({
    friends: [] as Friend[],
    // 仅 fetchFriends 成功后置位；loadFriends（IDB）不置位，否则后台 SWR 刷新会被缓存命中跳过
    loaded: false,
    /** 我相关的好友申请列表（含我发起的 + 别人加我的；后端按 id 倒序，前端不再分页） */
    friendRequests: [] as FriendRequest[]
  }),

  getters: {
    /** 按 friendUserId 找好友（含已软删的 DISABLE 记录，调用方自行判定） */
    getFriend:
      (state) =>
      (friendUserId: number): Friend | undefined => {
        return state.friends.find((f) => f.friendUserId === friendUserId)
      },
    /** 当前生效的好友列表（过滤掉 DISABLE 软删记录） */
    getActiveFriends: (state): Friend[] => {
      return state.friends.filter((f) => f.status !== CommonStatusEnum.DISABLE)
    },
    /** 判断对方是否是当前用户的有效好友（存在 + 非 DISABLE） */
    isFriend() {
      return (friendUserId: number): boolean => {
        const entry = this.getFriend(friendUserId)
        return !!entry && entry.status !== CommonStatusEnum.DISABLE
      }
    },
    /** 我的黑名单（blocked=true 且 ENABLE） */
    getBlockedFriends: (state): Friend[] => {
      return state.friends.filter(
        (f) => f.status !== CommonStatusEnum.DISABLE && f.blocked === true
      )
    },
    /** 未处理申请数（接收方=我）—— 实时派生，「新的朋友」红点用 */
    getUnhandledRequestCount: (state): number => {
      const me = Number(getCurrentUserId() || 0)
      return state.friendRequests.filter(
        (r) => r.handleResult === FriendRequestHandleResult.UNHANDLED && r.toUserId === me
      ).length
    }
  },

  actions: {
    // ==================== 本地缓存 ====================

    /** 从 IDB 恢复好友列表 */
    async loadFriends(): Promise<boolean> {
      const userId = getCurrentUserId()
      if (!userId) {
        return false
      }
      try {
        const cached = await imStorage.getItem<Friend[]>(StorageKeys.friends(userId))
        if (!cached || cached.length === 0) {
          return false
        }
        this.friends = cached
        return true
      } catch (e) {
        console.warn('[IM friendStore] 本地好友缓存读取失败', e)
        return false
      }
    },

    /** 整桶持久化好友列表（量级有限，不维护增量） */
    saveFriends(): void {
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      setQuietly(StorageKeys.friends(userId), this.friends, '[IM friendStore] 本地好友缓存写入失败')
    },

    // ==================== 远端拉取 ====================

    /** 从后端拉取并覆盖本地列表；同步刷新对应私聊会话的展示名 / 头像 + 落 IDB */
    async fetchFriends(force = false) {
      if (this.loaded && !force) {
        return
      }
      const list = await apiGetMyFriendList()
      this.friends = (list || []).map(convertFriend)
      this.loaded = true
      // 同步 conversationStore 私聊会话的展示名 / 头像 / 免打扰
      const conversationStore = useConversationStore()
      for (const friend of this.friends) {
        conversationStore.updateConversation(ImConversationType.PRIVATE, friend.friendUserId, {
          name: getFriendDisplayName(friend),
          avatar: friend.avatar,
          muted: friend.muted
        })
      }
      this.saveFriends()
    },

    /** 按 friendUserId 获取详情并合并到本地（保证 nickname / avatar 最新） */
    async loadFriendInfo(friendUserId: number) {
      try {
        const data = await apiGetFriend(friendUserId)
        if (!data) {
          return
        }
        this.upsertFriend(convertFriend(data))
      } catch (e) {
        console.warn('[IM friendStore] loadFriendInfo 失败', e)
      }
    },

    // ==================== 申请-审批 ====================

    /** 发起好友申请：成功后等待对方同意（不直接落地为好友） */
    async applyFriend(reqVO: ImFriendRequestApplyReqVO): Promise<number | null> {
      return await apiApplyFriendRequest(reqVO)
    },

    /** 同意一条好友申请；后端会双向落库 + 推 FRIEND_ADD，本端等通知到达再 upsertFriend */
    async agreeFriendRequest(requestId: number) {
      await apiAgreeFriendRequest(requestId)
      const request = this.findFriendRequest(requestId)
      if (request) {
        request.handleResult = FriendRequestHandleResult.AGREED
        request.handleTime = Date.now()
      } else {
        // 列表过期场景兜底重拉
        // TODO @AI：是不是只拉这个人？避免拉所有？
        await this.fetchFriendRequests()
      }
    },

    /** 拒绝一条好友申请 */
    async refuseFriendRequest(requestId: number, handleContent?: string) {
      await apiRefuseFriendRequest(requestId, handleContent)
      const request = this.findFriendRequest(requestId)
      if (request) {
        request.handleResult = FriendRequestHandleResult.REFUSED
        request.handleContent = handleContent
        request.handleTime = Date.now()
      } else {
        await this.fetchFriendRequests()
      }
    },

    /** 拉取「我相关」的好友申请列表（页面打开时 / 收到 FRIEND_APPLICATION 时刷新） */
    async fetchFriendRequests() {
      const list = await apiGetMyFriendRequestList()
      this.friendRequests = (list || []).map(convertFriendRequest)
    },

    /** 按 id 查申请记录 */
    findFriendRequest(requestId: number): FriendRequest | undefined {
      // TODO @AI：request
      return this.friendRequests.find((r) => r.id === requestId)
    },

    // ==================== 好友关系操作 ====================

    /** 删除好友（单向软删，本端置 DISABLE；级联清理本地私聊会话） */
    async deleteFriend(friendUserId: number) {
      await apiDeleteFriend(friendUserId)
      this.removeFriend(friendUserId)
    },

    /** 切换免打扰 */
    async setMuted(friendUserId: number, muted: boolean) {
      await apiUpdateFriend({ friendUserId, muted })
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.muted = muted
        this.saveFriends()
      }
    },

    /** 切换联系人置顶 */
    async setPinned(friendUserId: number, pinned: boolean) {
      await apiUpdateFriend({ friendUserId, pinned })
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.pinned = pinned
        this.saveFriends()
      }
    },

    /** 修改好友展示备注（仅自己可见） */
    async setDisplayName(friendUserId: number, displayName: string) {
      const value = displayName.trim()
      // 后端 displayName 语义：null/undefined = 不改，"" = 清空，所以这里直接传 value（可能是空串）
      await apiUpdateFriend({ friendUserId, displayName: value })
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.displayName = value
        const conversationStore = useConversationStore()
        conversationStore.updateConversation(ImConversationType.PRIVATE, friendUserId, {
          name: getFriendDisplayName(friend)
        })
        this.saveFriends()
      }
    },

    /** 本地合并 / 新增某个好友（WebSocket 事件 & 手动刷新都用） */
    upsertFriend(friend: Friend) {
      const index = this.friends.findIndex((f) => f.friendUserId === friend.friendUserId)
      if (index >= 0) {
        this.friends[index] = {
          ...this.friends[index],
          ...friend,
          status: friend.status ?? CommonStatusEnum.ENABLE
        }
      } else {
        this.friends.push({
          ...friend,
          status: friend.status ?? CommonStatusEnum.ENABLE
        })
      }
      const conversationStore = useConversationStore()
      const merged = this.getFriend(friend.friendUserId)
      conversationStore.updateConversation(ImConversationType.PRIVATE, friend.friendUserId, {
        name: merged ? getFriendDisplayName(merged) : friend.nickname,
        avatar: friend.avatar,
        muted: friend.muted
      })
      this.saveFriends()
    },

    /** 本地标记删除（WebSocket FRIEND_DELETE 事件触发；同时级联清私聊会话） */
    removeFriend(friendUserId: number) {
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.status = CommonStatusEnum.DISABLE
        friend.deleteTime = Date.now()
        friend.blocked = false
      }
      // 级联清理：把对应的私聊会话也软删，避免会话列表里留着已删好友
      const conversationStore = useConversationStore()
      conversationStore.removePrivateConversation(friendUserId)
      this.saveFriends()
    },

    // ==================== WebSocket 事件 dispatcher（1201-1210 段） ====================

    /** FRIEND_APPLICATION(1203)：收到新申请；payload 已裁减为核心字段，本地拉一次列表补齐 fromUser 等聚合字段 */
    applyFriendRequestNotification(_payload: FriendNotificationPayload) {
      this.fetchFriendRequests().catch(() => undefined)
    },

    /** FRIEND_REQUEST_APPROVED(1201)：我的申请被同意；按 requestId 更新状态（FRIEND_ADD 会另外推） */
    applyFriendRequestApprovedNotification(payload: FriendNotificationPayload) {
      const request = payload.requestId ? this.findFriendRequest(payload.requestId) : undefined
      if (request) {
        request.handleResult = FriendRequestHandleResult.AGREED
        request.handleTime = Date.now()
      } else {
        this.fetchFriendRequests().catch(() => undefined)
      }
    },

    /** FRIEND_REQUEST_REJECTED(1202)：我的申请被拒绝；按 requestId 更新状态 */
    applyFriendRequestRejectedNotification(payload: FriendNotificationPayload) {
      const request = payload.requestId ? this.findFriendRequest(payload.requestId) : undefined
      if (request) {
        request.handleResult = FriendRequestHandleResult.REFUSED
        request.handleContent = payload.handleContent
        request.handleTime = Date.now()
      } else {
        this.fetchFriendRequests().catch(() => undefined)
      }
    },

    /** FRIEND_ADD(1204)：新增好友；本端拉取好友详情并入库 */
    applyFriendAddNotification(payload: FriendNotificationPayload) {
      if (payload.friendUserId) {
        this.loadFriendInfo(payload.friendUserId).catch(() => undefined)
      }
    },

    /** FRIEND_DELETE(1205)：好友被删除；本端清理 + 级联会话 */
    applyFriendDeleteNotification(payload: FriendNotificationPayload) {
      if (payload.friendUserId) {
        this.removeFriend(payload.friendUserId)
      }
    },

    /** FRIEND_BLOCK(1207)：拉黑；多端同步 */
    applyFriendBlockNotification(payload: FriendNotificationPayload) {
      const friend = this.getFriend(payload.friendUserId)
      if (friend) {
        friend.blocked = true
        this.saveFriends()
      }
    },

    /** FRIEND_UNBLOCK(1208)：移出黑名单；多端同步 */
    applyFriendUnblockNotification(payload: FriendNotificationPayload) {
      const friend = this.getFriend(payload.friendUserId)
      if (friend) {
        friend.blocked = false
        this.saveFriends()
      }
    },

    /**
     * FRIEND_INFO_UPDATED(1209)：好友资料变更（昵称 / 头像）；重拉详情
     * TODO @AI：后端暂未实现 1209 推送；待 system 模块改昵称 / 头像时回调触发，本 dispatcher 已就绪
     */
    applyFriendInfoUpdatedNotification(payload: FriendNotificationPayload) {
      if (payload.friendUserId) {
        this.loadFriendInfo(payload.friendUserId).catch(() => undefined)
      }
    },

    /** FRIEND_UPDATE(1210)：批量更新（备注 / 免打扰 / 联系人置顶）；多端同步 */
    applyFriendUpdateNotification(payload: FriendNotificationPayload) {
      const friend = this.getFriend(payload.friendUserId)
      if (!friend) {
        return
      }
      if (payload.displayName != null) {
        friend.displayName = payload.displayName
      }
      if (payload.muted != null) {
        friend.muted = payload.muted
      }
      if (payload.pinned != null) {
        friend.pinned = payload.pinned
      }
      const conversationStore = useConversationStore()
      conversationStore.updateConversation(ImConversationType.PRIVATE, payload.friendUserId, {
        name: getFriendDisplayName(friend),
        muted: friend.muted
      })
      this.saveFriends()
    },

    /** 切账号时仅清 in-memory，IDB 按 userId 分桶天然隔离，回切秒开 */
    clear() {
      this.friends = []
      this.friendRequests = []
      this.loaded = false
    }
  }
})

function convertFriend(vo: ImFriendRespVO): Friend {
  return {
    id: vo.id,
    friendUserId: vo.friendUserId,
    nickname: vo.nickname || String(vo.friendUserId),
    nicknamePinyin: vo.nicknamePinyin,
    avatar: vo.avatar,
    muted: !!vo.muted,
    displayName: vo.displayName || '',
    displayNamePinyin: vo.displayNamePinyin,
    addSource: vo.addSource,
    pinned: !!vo.pinned,
    blocked: !!vo.blocked,
    status: vo.status,
    addTime: vo.addTime ? new Date(vo.addTime).getTime() : undefined,
    deleteTime: vo.deleteTime ? new Date(vo.deleteTime).getTime() : undefined
  }
}

function convertFriendRequest(vo: ImFriendRequestRespVO): FriendRequest {
  return {
    id: vo.id,
    fromUserId: vo.fromUserId,
    toUserId: vo.toUserId,
    handleResult: vo.handleResult,
    applyContent: vo.applyContent,
    handleContent: vo.handleContent,
    addSource: vo.addSource,
    handleTime: vo.handleTime ? new Date(vo.handleTime).getTime() : undefined,
    createTime: vo.createTime ? new Date(vo.createTime).getTime() : 0,
    fromNickname: vo.fromNickname,
    fromAvatar: vo.fromAvatar,
    toNickname: vo.toNickname,
    toAvatar: vo.toAvatar
  }
}

export const useFriendStoreWithOut = () => useFriendStore(store)

// dev: 让 Pinia 的 actions / state 改动支持 HMR，避免每次改 store 都得硬刷
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFriendStore, import.meta.hot))
}
