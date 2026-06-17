import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import { CommonStatusEnum } from '@/utils/constants'
import {
  getMyFriendList as apiGetMyFriendList,
  pullMyFriendList as apiPullMyFriendList,
  getFriend as apiGetFriend,
  deleteFriend as apiDeleteFriend,
  updateFriend as apiUpdateFriend,
  blockFriend as apiBlockFriend,
  unblockFriend as apiUnblockFriend,
  type ImFriendRespVO
} from '@/api/im/friend'
import {
  applyFriendRequest as apiApplyFriendRequest,
  agreeFriendRequest as apiAgreeFriendRequest,
  refuseFriendRequest as apiRefuseFriendRequest,
  getMyFriendRequestList as apiGetMyFriendRequestList,
  pullMyFriendRequestList as apiPullMyFriendRequestList,
  getMyFriendRequest as apiGetMyFriendRequest,
  type ImFriendRequestApplyReqVO,
  type ImFriendRequestRespVO
} from '@/api/im/friend/request'
import { useConversationStore } from './conversationStore'
import { ImConversationType, ImFriendRequestHandleResult } from '../../utils/constants'
import { FRIEND_REQUEST_PAGE_SIZE } from '../../utils/config'
import { getDb, StorageKeys } from '../../utils/db'
import { runIncrementalPull } from '../../utils/pull'
import { getCurrentUserId } from '@/utils/auth'
import { getFriendDisplayName } from '../../utils/user'
import type { Friend, FriendDO, FriendLite, FriendRequest, FriendRequestDO } from '../types'

type PendingRequest = { epoch: number; userId: number; promise: Promise<void> }

/** 当前正在进行的好友列表拉取；多 dispatcher 同时触发时复用同一 Promise，避免雪崩重拉 */
let pendingFetchFriends: PendingRequest | null = null
/** 当前正在进行的好友申请列表拉取；多端连续多条申请到达时复用同一 Promise，避免雪崩重拉 */
let pendingFetchRequests: PendingRequest | null = null
/** 当前正在进行的「加载更多申请」请求 */
let pendingLoadMoreRequests: PendingRequest | null = null
/** 当前正在进行的好友详情请求 */
const pendingFetchFriendInfos = new Map<string, Promise<void>>()

/** clear() 时递增；旧账号那次还没返回的请求 resolve 后比对一致才写 store，防跨账号数据泄漏 */
let storeEpoch = 0

/** 构建好友详情请求去重 key */
function getPendingFriendInfoKey(userId: number, friendUserId: number): string {
  return `${userId}:${friendUserId}`
}

/** 好友通知 payload（对齐后端 BaseFriendNotification + 子类裁减后的字段） */
export interface FriendNotificationPayload {
  operatorUserId: number
  friendUserId: number
  // FRIEND_REQUEST_* 系列：申请记录的核心字段（避免 payload 携带完整 DO）
  requestId?: number
  applyContent?: string
  handleContent?: string
  addSource?: number
  // FRIEND_REQUEST_RECEIVED：申请方聚合字段，供前端直推 push 进列表，无需回拉
  fromNickname?: string
  fromAvatar?: string
  // FRIEND_UPDATE：单边属性变更
  displayName?: string
  silent?: boolean
  pinned?: boolean
  // FRIEND_DELETE：是否级联清理本端相关数据（如私聊会话）
  clear?: boolean
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
    // 仅 fetchFriendList 成功后置位；loadFriendData（IDB）不置位，否则后台 SWR 刷新会被缓存命中跳过
    loaded: false,
    /** 我相关的好友申请列表（含我发起的 + 别人加我的；后端按 id 倒序游标分页） */
    friendRequests: [] as FriendRequest[],
    /** 是否还有更早的申请记录可加载；返回不满 page size 即置 false */
    hasMoreFriendRequests: true
  }),

  getters: {
    /**
     * friendUserId → Friend 的 O(1) 索引；从 friends 数组派生，Pinia 在 friends 变化时自动重算
     *
     * 消息渲染需要按 senderId 反查发送人头像 / 备注，每条消息渲染都会 getFriend；
     * 直接 find 时 N 条消息 × M 好友 = O(N×M)；建索引后单次读 O(1)，重建只在写好友（fetchFriendList / upsertFriend 等）时发生
     */
    getFriendMap: (state): Map<number, Friend> => {
      const map = new Map<number, Friend>()
      for (const friend of state.friends) {
        map.set(friend.friendUserId, friend)
      }
      return map
    },
    /** 按 friendUserId 找好友（含已软删的 DISABLE 记录，调用方自行判定） */
    getFriend(): (friendUserId: number) => Friend | undefined {
      return (friendUserId: number) => this.getFriendMap.get(friendUserId)
    },
    /** 当前生效的好友列表（过滤掉 DISABLE 软删记录） */
    getActiveFriendList: (state): Friend[] => {
      return state.friends.filter((friend) => friend.status !== CommonStatusEnum.DISABLE)
    },
    /** 当前生效好友的 Lite 视图（PickerPanel / 选人弹窗共用，自带拼音字段供分桶 / 搜索） */
    getActiveFriendLiteList(): FriendLite[] {
      return this.getActiveFriendList.map((friend: Friend) => ({
        id: friend.friendUserId,
        nickname: friend.nickname,
        nicknamePinyin: friend.nicknamePinyin,
        avatar: friend.avatar,
        displayName: friend.displayName,
        displayNamePinyin: friend.displayNamePinyin
      }))
    },
    /** 判断对方是否是当前用户的有效好友（存在 + 非 DISABLE） */
    isActiveFriend() {
      return (friendUserId: number): boolean => {
        const entry = this.getFriend(friendUserId)
        return !!entry && entry.status !== CommonStatusEnum.DISABLE
      }
    },
    /** 我的黑名单（blocked=true 且 ENABLE） */
    getBlockedFriendList: (state): Friend[] => {
      return state.friends.filter(
        (friend) => friend.status !== CommonStatusEnum.DISABLE && friend.blocked === true
      )
    },
    /** 未处理申请数（接收方=我）—— 实时派生，「新的朋友」红点用 */
    getUnhandledRequestCount: (state): number => {
      const currentUserId = getCurrentUserId()
      return state.friendRequests.filter(
        (request) =>
          request.handleResult === ImFriendRequestHandleResult.UNHANDLED &&
          request.toUserId === currentUserId
      ).length
    }
  },

  actions: {
    // ==================== 本地缓存 ====================

    /** 从 IndexedDB 恢复好友和好友申请 */
    async loadFriendData(): Promise<boolean> {
      try {
        const [friends, friendRequests] = await Promise.all([
          getDb().getAll<FriendDO>('friends'),
          getDb().getAll<FriendRequestDO>('friendRequests')
        ])
        if (friends.length > 0) {
          this.friends = friends
        }
        if (friendRequests.length > 0) {
          this.friendRequests = friendRequests.sort(
            (requestA, requestB) => requestB.id - requestA.id
          )
          this.hasMoreFriendRequests = friendRequests.length >= FRIEND_REQUEST_PAGE_SIZE
        }
        return friends.length > 0
      } catch (e) {
        console.warn('[IM friendStore] 本地好友缓存读取失败', e)
        return false
      }
    },

    /** 保存好友列表 */
    saveFriendList(): void {
      void getDb()
        .transaction(['friends'], 'readwrite', async (tx) => {
          const db = getDb()
          await db.clearStore('friends', tx)
          for (const friend of this.friends) {
            if (friend.id) {
              await db.put('friends', friend, tx)
            }
          }
        })
        .catch((e) => console.warn('[IM friendStore] 本地好友缓存写入失败', e))
    },

    /** 保存单个好友 */
    async saveFriendRecord(friend: Friend | undefined): Promise<void> {
      if (!friend?.id) {
        return
      }
      await getDb().put('friends', friend)
    },

    /** 保存单个好友 */
    saveFriend(friend: Friend | undefined): void {
      void this.saveFriendRecord(friend).catch((e) =>
        console.warn('[IM friendStore] 本地好友写入失败', e)
      )
    },

    /** 保存好友申请列表 */
    saveFriendRequestList(): void {
      void getDb()
        .transaction(['friendRequests'], 'readwrite', async (tx) => {
          const db = getDb()
          await db.clearStore('friendRequests', tx)
          for (const request of this.friendRequests) {
            await db.put('friendRequests', request, tx)
          }
        })
        .catch((e) => console.warn('[IM friendStore] 本地好友申请缓存写入失败', e))
    },

    /** 保存单条好友申请 */
    async saveFriendRequestRecord(request: FriendRequest | undefined): Promise<void> {
      if (!request) {
        return
      }
      await getDb().put('friendRequests', request)
    },

    /** 保存单条好友申请 */
    saveFriendRequest(request: FriendRequest | undefined): void {
      void this.saveFriendRequestRecord(request).catch((e) =>
        console.warn('[IM friendStore] 本地好友申请写入失败', e)
      )
    },

    // ==================== 远端拉取 ====================

    /** 从后端拉取并覆盖本地列表（含 DISABLE 历史好友给已删对话兜底）；只同步 ENABLE 的会话信息，DISABLE 的不动 —— cascade 清会话由 WS dispatcher 按 payload.clear 处理，避免 fetchFriendList 覆盖用户「不清空聊天记录」的选择 */
    async fetchFriendList(force = false) {
      if (this.loaded && !force) {
        return
      }
      // 快照 epoch；clear() 之后到 .then 之间触发的 epoch++ 表示账号已切，旧结果不能写入新 store
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      if (
        pendingFetchFriends?.epoch === requestEpoch &&
        pendingFetchFriends.userId === requestUserId
      ) {
        return pendingFetchFriends.promise
      }
      const promise = apiGetMyFriendList()
        .then((list) => {
          if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
            return
          }
          this.friends = (list || []).map(convertFriend)
          this.loaded = true
          const conversationStore = useConversationStore()
          for (const friend of this.friends) {
            if (friend.status === CommonStatusEnum.DISABLE) {
              continue
            }
            conversationStore.updateConversation(ImConversationType.PRIVATE, friend.friendUserId, {
              name: getFriendDisplayName(friend),
              avatar: friend.avatar,
              silent: friend.silent
            })
          }
          this.saveFriendList()
        })
        .finally(() => {
          if (
            pendingFetchFriends?.epoch === requestEpoch &&
            pendingFetchFriends.userId === requestUserId
          ) {
            pendingFetchFriends = null
          }
        })
      pendingFetchFriends = { epoch: requestEpoch, userId: requestUserId, promise }
      return promise
    },

    /**
     * 增量拉取好友变更并合并：进入 IM 首屏主数据恢复（空游标 = 首次全量增量拉）+ 重连 / 离线补偿
     *
     * 含已删除好友，按 status 走 upsert
     */
    async pullFriends() {
      // 快照 epoch；账号在拉取途中切换（clear() → epoch++）时丢弃旧账号那几页结果，防跨账号数据泄漏
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      const isActive = () => requestEpoch === storeEpoch && getCurrentUserId() === requestUserId
      await runIncrementalPull(
        StorageKeys.settings.friendPullCursor,
        apiPullMyFriendList,
        async (records) => {
          if (!isActive()) {
            return false
          }
          await Promise.all(records.map((vo) => this.upsertFriendForPull(convertFriend(vo))))
          return true
        },
        isActive
      )
      // 置 loaded，供通讯录页 fetchFriendList(force=false) 复用缓存而非重复全量拉
      if (isActive()) {
        this.loaded = true
      }
    },

    /** 按 friendUserId 获取详情并合并到本地（保证 nickname / avatar 最新） */
    async fetchFriendInfo(friendUserId: number) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      if (!requestUserId) {
        return
      }
      const key = getPendingFriendInfoKey(requestUserId, friendUserId)
      const inflight = pendingFetchFriendInfos.get(key)
      if (inflight) {
        return inflight
      }
      const promise = (async () => {
        try {
          const data = await apiGetFriend(friendUserId)
          if (!data) {
            return
          }
          // clear() 已切账号：旧请求的好友详情不能再 upsert 进新账号的 friends
          if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
            return
          }
          this.upsertFriend(convertFriend(data))
        } catch (e) {
          console.warn('[IM friendStore] fetchFriendInfo 失败', e)
        }
      })().finally(() => {
        if (pendingFetchFriendInfos.get(key) === promise) {
          pendingFetchFriendInfos.delete(key)
        }
      })
      pendingFetchFriendInfos.set(key, promise)
      return promise
    },

    // ==================== 申请-审批 ====================

    /** 发起好友申请：成功后等待对方同意（不直接落地为好友） */
    async applyFriendRequest(reqVO: ImFriendRequestApplyReqVO): Promise<number | null> {
      return await apiApplyFriendRequest(reqVO)
    },

    /** 同意一条好友申请；后端会双向落库 + 推 FRIEND_ADD，本端等通知到达再 upsertFriend */
    async agreeFriendRequest(requestId: number) {
      await apiAgreeFriendRequest(requestId)
      await this.applyHandleResult(requestId, ImFriendRequestHandleResult.AGREED)
    },

    /** 拒绝一条好友申请 */
    async refuseFriendRequest(requestId: number, handleContent?: string) {
      await apiRefuseFriendRequest(requestId, handleContent)
      await this.applyHandleResult(requestId, ImFriendRequestHandleResult.REFUSED, handleContent)
    },

    /** 把 handleResult 应用到本地申请记录；找不到就按 id 单查兜底 upsert，避免破坏 id 倒序 */
    async applyHandleResult(
      requestId: number,
      result: number,
      handleContent?: string
    ): Promise<void> {
      const request = this.getFriendRequest(requestId)
      if (request) {
        request.handleResult = result
        if (handleContent !== undefined) {
          request.handleContent = handleContent
        }
        request.handleTime = Date.now()
        this.saveFriendRequest(request)
        return
      }
      await this.fetchFriendRequest(requestId)
    },

    /** 拉取「我相关」的好友申请列表首页（页面打开 / 收到 FRIEND_REQUEST_RECEIVED 时刷新）；pending 期间复用同一 Promise */
    async fetchFriendRequestList() {
      if (pendingFetchRequests) {
        const currentUserId = getCurrentUserId()
        if (
          pendingFetchRequests.epoch === storeEpoch &&
          pendingFetchRequests.userId === currentUserId
        ) {
          return pendingFetchRequests.promise
        }
      }
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      const promise = apiGetMyFriendRequestList(FRIEND_REQUEST_PAGE_SIZE)
        .then((list) => {
          if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
            return
          }
          const items = (list || []).map(convertFriendRequest)
          this.friendRequests = items
          // 不足一页即没有更多；满页可能还有，等 loadMore 拉到 0 条再确定
          this.hasMoreFriendRequests = items.length >= FRIEND_REQUEST_PAGE_SIZE
          this.saveFriendRequestList()
        })
        .finally(() => {
          if (
            pendingFetchRequests?.epoch === requestEpoch &&
            pendingFetchRequests.userId === requestUserId
          ) {
            pendingFetchRequests = null
          }
        })
      pendingFetchRequests = { epoch: requestEpoch, userId: requestUserId, promise }
      return promise
    },

    /** 加载更多申请（按本地最旧 requestId 游标分页）；无更多 / pending 中直接返回 */
    async loadMoreFriendRequestList() {
      const requestUserId = getCurrentUserId()
      const hasSameFetchPending =
        pendingFetchRequests?.epoch === storeEpoch && pendingFetchRequests.userId === requestUserId
      if (!this.hasMoreFriendRequests || hasSameFetchPending) {
        return
      }
      if (
        pendingLoadMoreRequests?.epoch === storeEpoch &&
        pendingLoadMoreRequests.userId === requestUserId
      ) {
        return pendingLoadMoreRequests.promise
      }
      const oldest = this.friendRequests[this.friendRequests.length - 1]
      if (!oldest) {
        return this.fetchFriendRequestList()
      }
      const requestEpoch = storeEpoch
      const promise = apiGetMyFriendRequestList(FRIEND_REQUEST_PAGE_SIZE, oldest.id)
        .then((list) => {
          if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
            return
          }
          const items = (list || []).map(convertFriendRequest)
          this.friendRequests.push(...items)
          this.hasMoreFriendRequests = items.length >= FRIEND_REQUEST_PAGE_SIZE
          this.saveFriendRequestList()
        })
        .finally(() => {
          if (
            pendingLoadMoreRequests?.epoch === requestEpoch &&
            pendingLoadMoreRequests.userId === requestUserId
          ) {
            pendingLoadMoreRequests = null
          }
        })
      pendingLoadMoreRequests = { epoch: requestEpoch, userId: requestUserId, promise }
      return promise
    },

    /** 按 id 查申请记录；列表是按 id 倒序的小列表，O(n) find 即可，不再维护 Map 索引 */
    getFriendRequest(requestId: number): FriendRequest | undefined {
      return this.friendRequests.find((request) => request.id === requestId)
    },

    /** 按 id 从后端单查并 upsert 到本地（dispatcher 兜底用，避免全量重拉）；后端带越权过滤 */
    async fetchFriendRequest(requestId: number) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      const data = await apiGetMyFriendRequest(requestId)
      if (!data) {
        return
      }
      // clear() 已切账号：旧请求的申请记录不能再写进新账号的 friendRequests
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      this.upsertFriendRequest(convertFriendRequest(data))
    },

    /** 合并单条好友申请：已有则按 id 覆盖；新记录按 id 倒序插入（比本地最旧还老则跳过，留给 loadMore 带回） */
    upsertFriendRequest(next: FriendRequest) {
      void this.upsertFriendRequestForPull(next).catch((e) =>
        console.warn('[IM friendStore] 本地好友申请写入失败', e)
      )
    },

    /** 合并单条好友申请 */
    async upsertFriendRequestForPull(next: FriendRequest): Promise<void> {
      const existing = this.getFriendRequest(next.id)
      if (existing) {
        Object.assign(existing, next)
        await this.saveFriendRequestRecord(existing)
        return
      }
      // 比本地最旧 id 还老：不入列表，让 loadMore 自然带回，避免破坏 id 倒序 / 后续 loadMore 重复 push
      const oldest = this.friendRequests[this.friendRequests.length - 1]
      if (oldest && next.id < oldest.id) {
        return
      }
      // 按 id 倒序找首个比自己小的位置插入；找不到则追加末尾
      const insertIndex = this.friendRequests.findIndex((request) => request.id < next.id)
      if (insertIndex < 0) {
        this.friendRequests.push(next)
      } else {
        this.friendRequests.splice(insertIndex, 0, next)
      }
      await this.saveFriendRequestRecord(next)
    },

    /** 增量拉取好友申请变更并合并（重连 / 离线补偿）；按 update_time + id 游标，已处理的按 handleResult 覆盖 */
    async pullFriendRequests() {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      const isActive = () => requestEpoch === storeEpoch && getCurrentUserId() === requestUserId
      await runIncrementalPull(
        StorageKeys.settings.friendRequestPullCursor,
        apiPullMyFriendRequestList,
        async (records) => {
          if (!isActive()) {
            return false
          }
          await Promise.all(
            records.map((vo) => this.upsertFriendRequestForPull(convertFriendRequest(vo)))
          )
          return true
        },
        isActive
      )
    },

    // ==================== 好友关系操作 ====================

    /** 删除好友（单向软删，本端置 DISABLE）；clear=true 时级联清理本地相关数据（如私聊会话），并透传后端给多端同步 */
    async deleteFriend(friendUserId: number, clear: boolean = true) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      await apiDeleteFriend(friendUserId, clear)
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      this.removeFriend(friendUserId, clear)
    },

    /** 切换免打扰：同步会话的 silent 字段，避免会话列表 silent 图标等 1210 推到才更新 */
    async setFriendSilent(friendUserId: number, silent: boolean) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      await apiUpdateFriend({ friendUserId, silent })
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.silent = silent
        const conversationStore = useConversationStore()
        conversationStore.updateConversation(ImConversationType.PRIVATE, friendUserId, { silent })
        this.saveFriend(friend)
      }
    },

    /** 切换联系人置顶 */
    async setFriendPinned(friendUserId: number, pinned: boolean) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      await apiUpdateFriend({ friendUserId, pinned })
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.pinned = pinned
        this.saveFriend(friend)
      }
    },

    /** 拉黑好友：本端乐观更新 + 调接口；后端 FRIEND_BLOCK 推到时由 dispatcher 兜底同步多端 */
    async blockFriend(friendUserId: number) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      await apiBlockFriend(friendUserId)
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.blocked = true
        this.saveFriend(friend)
      }
    },

    /** 移出黑名单：本端乐观更新 + 调接口；后端 FRIEND_UNBLOCK 推到时由 dispatcher 兜底同步多端 */
    async unblockFriend(friendUserId: number) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      await apiUnblockFriend(friendUserId)
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.blocked = false
        this.saveFriend(friend)
      }
    },

    /** 修改好友展示备注（仅自己可见） */
    async setFriendDisplayName(friendUserId: number, displayName: string) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      const value = displayName.trim()
      // 后端 displayName 语义：null/undefined = 不改，"" = 清空，所以这里直接传 value（可能是空串）
      await apiUpdateFriend({ friendUserId, displayName: value })
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.displayName = value
        const conversationStore = useConversationStore()
        conversationStore.updateConversation(ImConversationType.PRIVATE, friendUserId, {
          name: getFriendDisplayName(friend)
        })
        this.saveFriend(friend)
      }
    },

    /** 本地合并 / 新增某个好友（WebSocket 事件 & 手动刷新都用） */
    upsertFriend(friend: Friend) {
      void this.upsertFriendForPull(friend).catch((e) =>
        console.warn('[IM friendStore] 本地好友写入失败', e)
      )
    },

    /** 本地合并 / 新增某个好友 */
    async upsertFriendForPull(friend: Friend): Promise<void> {
      const index = this.friends.findIndex(
        (existing) => existing.friendUserId === friend.friendUserId
      )
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
        silent: friend.silent
      })
      await this.saveFriendRecord(merged)
    },

    /** 本地标记删除（WebSocket FRIEND_DELETE 事件触发；clear=true 时级联清相关数据如私聊会话） */
    removeFriend(friendUserId: number, clear: boolean = true) {
      const friend = this.getFriend(friendUserId)
      if (friend) {
        // blocked 不动，跟后端 deleteFriend0「删好友期间保留拉黑状态」对齐
        friend.status = CommonStatusEnum.DISABLE
        friend.deleteTime = Date.now()
      }
      if (clear) {
        const conversationStore = useConversationStore()
        conversationStore.removePrivateConversation(friendUserId)
      }
      this.saveFriend(friend)
    },

    // ==================== WebSocket 事件 dispatcher（1201-1210 段） ====================

    /** FRIEND_REQUEST_RECEIVED(1203)：收到新申请；payload 已带申请方昵称 / 头像，按 requestId 直推 push 进列表 */
    applyFriendRequestReceivedNotification(payload: FriendNotificationPayload) {
      const currentUserId = getCurrentUserId()
      const existingIndex = this.friendRequests.findIndex((item) => item.id === payload.requestId)
      if (existingIndex >= 0) {
        const existing = this.friendRequests.splice(existingIndex, 1)[0]
        const next = {
          ...existing,
          fromUserId: payload.operatorUserId,
          toUserId: currentUserId,
          handleResult: ImFriendRequestHandleResult.UNHANDLED,
          applyContent: payload.applyContent,
          addSource: payload.addSource,
          createTime: Date.now(),
          fromNickname: payload.fromNickname,
          fromAvatar: payload.fromAvatar
        }
        this.friendRequests.unshift(next)
        this.saveFriendRequest(next)
        return
      }
      const next = {
        id: payload.requestId!,
        fromUserId: payload.operatorUserId,
        toUserId: currentUserId,
        handleResult: ImFriendRequestHandleResult.UNHANDLED,
        applyContent: payload.applyContent,
        addSource: payload.addSource,
        createTime: Date.now(),
        fromNickname: payload.fromNickname,
        fromAvatar: payload.fromAvatar
      }
      this.friendRequests.unshift(next)
      this.saveFriendRequest(next)
    },

    /** FRIEND_REQUEST_APPROVED(1201)：我的申请被同意；按 requestId 更新状态（FRIEND_ADD 会另外推） */
    applyFriendRequestApprovedNotification(payload: FriendNotificationPayload) {
      void this.applyHandleResult(payload.requestId!, ImFriendRequestHandleResult.AGREED)
    },

    /** FRIEND_REQUEST_REJECTED(1202)：我的申请被拒绝；按 requestId 更新状态 */
    applyFriendRequestRejectedNotification(payload: FriendNotificationPayload) {
      void this.applyHandleResult(
        payload.requestId!,
        ImFriendRequestHandleResult.REFUSED,
        payload.handleContent
      )
    },

    /**
     * FRIEND_ADD(1204)：新增好友；本端拉取好友详情并入库
     * peerUserId 由 websocketStore 按帧 sender / receiver 算好传入：becomeFriends 单条入库后双方收到同一份 payload，
     * 本端真正的「对端」是帧上的另一个用户，不是 payload.friendUserId（payload 里固定是 toUserId）。
     */
    applyFriendAddNotification(_payload: FriendNotificationPayload, peerUserId: number) {
      if (this.isActiveFriend(peerUserId)) {
        return
      }
      void this.fetchFriendInfo(peerUserId)
    },

    /**
     * FRIEND_DELETE(1205)：好友被删除；本端清理 + 按 payload.clear 决定是否级联清会话（多端跟主操作端一致）
     * peerUserId 由 websocketStore 按帧 sender / receiver 算好传入；与 FRIEND_ADD 保持一致的 peer 推断
     */
    applyFriendDeleteNotification(payload: FriendNotificationPayload, peerUserId: number) {
      this.removeFriend(peerUserId, payload.clear !== false)
    },

    /** FRIEND_BLOCK(1207)：拉黑；多端同步 */
    applyFriendBlockNotification(payload: FriendNotificationPayload) {
      const friend = this.getFriend(payload.friendUserId)
      if (friend) {
        friend.blocked = true
        this.saveFriend(friend)
      }
    },

    /** FRIEND_UNBLOCK(1208)：移出黑名单；多端同步 */
    applyFriendUnblockNotification(payload: FriendNotificationPayload) {
      const friend = this.getFriend(payload.friendUserId)
      if (friend) {
        friend.blocked = false
        this.saveFriend(friend)
      }
    },

    /** FRIEND_INFO_UPDATED(1209)：好友资料变更（昵称 / 头像）；重拉详情 */
    applyFriendInfoUpdatedNotification(payload: FriendNotificationPayload) {
      void this.fetchFriendInfo(payload.friendUserId)
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
      if (payload.silent != null) {
        friend.silent = payload.silent
      }
      if (payload.pinned != null) {
        friend.pinned = payload.pinned
      }
      const conversationStore = useConversationStore()
      conversationStore.updateConversation(ImConversationType.PRIVATE, payload.friendUserId, {
        name: getFriendDisplayName(friend),
        silent: friend.silent
      })
      this.saveFriend(friend)
    },

    /** 清空好友内存状态，并废弃未返回请求（pending Promise 置空 + storeEpoch++） */
    clear() {
      this.friends = []
      this.friendRequests = []
      this.loaded = false
      this.hasMoreFriendRequests = true
      pendingFetchFriends = null
      pendingFetchRequests = null
      pendingLoadMoreRequests = null
      pendingFetchFriendInfos.clear()
      storeEpoch++
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
    silent: !!vo.silent,
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
