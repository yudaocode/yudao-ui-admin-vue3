import { defineStore } from 'pinia'
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
    loaded: false
  }),

  getters: {
    getFriend:
      (state) =>
      (friendUserId: number): Friend | undefined => {
        return state.friends.find((f) => f.friendUserId === friendUserId)
      },
    getActiveFriends: (state): Friend[] => {
      return state.friends.filter((f) => f.status !== CommonStatusEnum.DISABLE)
    },
    isFriend() {
      return (friendUserId: number): boolean => {
        const entry = this.getFriend(friendUserId)
        return !!entry && entry.status !== CommonStatusEnum.DISABLE
      }
    }
  },

  actions: {
    /** 从后端拉取并覆盖本地列表；同步刷新对应私聊会话的展示名 / 头像 */
    async loadFriends(force = false) {
      if (this.loaded && !force) {
        return
      }
      const list = await apiGetMyFriendList()
      this.friends = (list || []).map(toFriend)
      this.loaded = true
      // 同步 conversationStore 私聊会话的展示名 / 头像 / 免打扰
      const conversationStore = useConversationStore()
      for (const f of this.friends) {
        conversationStore.updateConversation(ImConversationType.PRIVATE, f.friendUserId, {
          name: f.nickname,
          avatar: f.avatar,
          muted: f.muted
        })
      }
    },

    /** 按 friendUserId 获取详情并合并到本地（保证 nickname / avatar 最新） */
    async loadFriendInfo(friendUserId: number) {
      try {
        const data = await apiGetFriend(friendUserId)
        if (!data) {
          return
        }
        this.upsertFriend(toFriend(data))
      } catch (e) {
        console.warn('[IM friendStore] loadFriendInfo 失败', e)
      }
    },

    /** 添加好友：后端双向建立关系后，本地占位插入（服务端返回后可 loadFriends 刷新） */
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

    /** 删除好友（保留墓碑记录，同时级联清理本地私聊会话） */
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
      conversationStore.updateConversation(ImConversationType.PRIVATE, friend.friendUserId, {
        name: friend.nickname,
        avatar: friend.avatar,
        muted: friend.muted
      })
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
    },

    /** 切换免打扰 */
    async setMuted(friendUserId: number, muted: boolean) {
      await apiUpdateFriend({ friendUserId, muted })
      const friend = this.getFriend(friendUserId)
      if (friend) {
        friend.muted = muted
      }
    },

    /** 切换用户时清空 */
    clear() {
      this.friends = []
      this.loaded = false
    }
  }
})

function toFriend(vo: ImFriendRespVO): Friend {
  return {
    id: vo.id,
    friendUserId: vo.friendUserId,
    nickname: vo.nickname || String(vo.friendUserId),
    avatar: vo.avatar,
    muted: !!vo.muted,
    status: vo.status,
    addTime: vo.addTime ? new Date(vo.addTime).getTime() : undefined,
    deleteTime: vo.deleteTime ? new Date(vo.deleteTime).getTime() : undefined
  }
}

export const useFriendStoreWithOut = () => useFriendStore(store)
