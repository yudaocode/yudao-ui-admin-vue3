import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import { CommonStatusEnum } from '@/utils/constants'
import {
  getMyFriendList as apiGetMyFriendList,
  getFriend as apiGetFriend,
  addFriend as apiAddFriend,
  deleteFriend as apiDeleteFriend,
  updateFriend as apiUpdateFriend,
  type ImFriendRespVO
} from '@/api/im/friend'
import { useConversationStore } from './conversationStore'
import { ImConversationType } from '../../utils/constants'
import { getCurrentUserId, imStorage, safeImSet, StorageKeys } from '../../utils/storage'
import { getFriendDisplayName } from '../../utils/user'
import type { Friend } from '../types'

/**
 * IM 好友 Store
 *
 * 负责：
 * - 拉取 / 缓存当前登录用户的好友列表
 * - 加好友 / 删好友（走后端 API + 本地乐观同步）
 * - 被 ConversationItem / FriendPage / MessageInput 等多处消费
 */
export const useFriendStore = defineStore('imFriendStore', {
  state: () => ({
    friends: [] as Friend[],
    // 仅 fetchFriends 成功后置位；loadFriends（IDB）不置位，否则后台 SWR 刷新会被短路
    loaded: false
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
    }
  },

  actions: {
    // ==================== 本地缓存 ====================

    // TODO @AI：是不是不用 “不更新 conversationStore——会话缓存和好友缓存是同一会话写入的，名字头像天然一致” 注释。只要说明 boolean 是啥就行了把。
    /**
     * 从 IDB 恢复好友列表，返回 boolean 给首屏 SWR 决策用
     *
     * 不更新 conversationStore——会话缓存和好友缓存是同一会话写入的，名字头像天然一致
     */
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
      safeImSet(StorageKeys.friends(userId), this.friends, '[IM friendStore] 本地好友缓存写入失败')
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

    /** 添加好友：后端双向建立关系后，本地占位插入（服务端返回后可 fetchFriends 刷新） */
    async addFriend(friendUserId: number, preview?: Partial<Friend>) {
      await apiAddFriend(friendUserId)
      if (preview) {
        this.upsertFriend({
          friendUserId,
          nickname: preview.nickname || String(friendUserId),
          avatar: preview.avatar,
          status: CommonStatusEnum.ENABLE
        })
      } else {
        await this.loadFriendInfo(friendUserId)
      }
    },

    /** 删除好友（软删，保留记录但置 DISABLE；同时级联清理本地私聊会话） */
    async deleteFriend(friendUserId: number) {
      await apiDeleteFriend(friendUserId)
      this.removeFriend(friendUserId)
    },

    /** 本地合并 / 新增某个好友（WebSocket 事件 & 手动刷新都用） */
    upsertFriend(friend: Friend) {
      // 按 friendUserId 查已有记录下标：>=0 命中则覆盖合并，<0 则追加
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
      // 同步对应私聊会话的展示
      const conversationStore = useConversationStore()
      const merged = this.getFriend(friend.friendUserId)
      conversationStore.updateConversation(ImConversationType.PRIVATE, friend.friendUserId, {
        name: merged ? getFriendDisplayName(merged) : friend.nickname,
        avatar: friend.avatar,
        muted: friend.muted
      })
      this.saveFriends()
    },

    /** 本地标记删除（WebSocket FRIEND_DEL 事件触发；同时级联清私聊会话） */
    removeFriend(friendUserId: number) {
      // 软删：保留记录但置为 DISABLE，避免后续误判"陌生人"
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.status = CommonStatusEnum.DISABLE
        friend.deleteTime = Date.now()
      }
      // 级联清理：把对应的私聊会话也软删，避免会话列表里留着已删好友
      const conversationStore = useConversationStore()
      conversationStore.removePrivateConversation(friendUserId)
      this.saveFriends()
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

    /**
     * 修改好友展示备注（仅自己可见）
     *
     * 走后端 /im/friend/update 接口；保存成功后再同步本地 friend + 会话列表 name，
     * 失败就直接抛给上层，让 UI 决定是否回滚 / 提示用户
     */
    async setDisplayName(friendUserId: number, displayName: string) {
      const value = displayName.trim()
      // 后端的 displayName 语义：null/undefined = 不改，"" = 清空，所以这里直接传 value（可能是空串）
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

    /** 切账号时仅清 in-memory，IDB 按 userId 分桶天然隔离，回切秒开 */
    clear() {
      this.friends = []
      this.loaded = false
    }
  }
})

function convertFriend(vo: ImFriendRespVO): Friend {
  return {
    id: vo.id,
    friendUserId: vo.friendUserId,
    nickname: vo.nickname || String(vo.friendUserId),
    avatar: vo.avatar,
    muted: !!vo.muted,
    displayName: vo.displayName || '',
    status: vo.status,
    addTime: vo.addTime ? new Date(vo.addTime).getTime() : undefined,
    deleteTime: vo.deleteTime ? new Date(vo.deleteTime).getTime() : undefined
  }
}

export const useFriendStoreWithOut = () => useFriendStore(store)

// dev: 让 Pinia 的 actions / state 改动支持 HMR，避免每次改 store 都得硬刷
// 否则 Vite 把新模块推下来后，老 store 实例的 action 闭包仍指向旧函数体
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFriendStore, import.meta.hot))
}
