import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import {
  getMyGroupList as apiGetMyGroupList,
  getGroup as apiGetGroup,
  type ImGroupRespVO
} from '@/api/im/group'
import {
  getGroupMemberList as apiGetGroupMemberList,
  updateGroupMember as apiUpdateGroupMember,
  type ImGroupMemberRespVO
} from '@/api/im/group/member'
import { useUserStore } from '@/store/modules/user'
import { useConversationStore } from './conversationStore'
import { ImConversationType } from '../../utils/constants'
import type { Group, GroupMember } from '../types'

/**
 * IM 群 Store
 *
 * 负责：
 * - 拉取 / 缓存当前登录用户加入的群列表
 * - 按 groupId 懒加载群成员（供 ConversationGroupSide / MentionPicker / MessageReadStatus 消费）
 * - 成员"已读 / 未读"等聚合查询由 MessageReadStatus 另行组合
 */
export const useGroupStore = defineStore('imGroupStore', {
  state: () => ({
    groups: [] as Group[],
    loaded: false
  }),

  getters: {
    getGroup:
      (state) =>
      (id: number): Group | undefined => {
        return state.groups.find((g) => g.id === id)
      }
  },

  actions: {
    /** 拉取群列表；同步刷新对应群聊会话的展示名 / 头像 */
    async loadGroups(force = false) {
      if (this.loaded && !force) {
        return
      }
      // 拉取当前登录用户加入的所有群（不带成员；成员按需再走 loadGroupMembers）
      const list = await apiGetMyGroupList()
      const fresh = (list || []).map(convertGroup)
      // 合并而非全量替换：保留 loadGroupMembers 已经写入的 members / memberCount / muted
      // （这些字段不在 ImGroupRespVO 里，全量替换会把成员级数据全冲掉）
      const groupMap = new Map(this.groups.map((group) => [group.id, group]))
      this.groups = fresh.map((group) => {
        const existing = groupMap.get(group.id)
        if (!existing) {
          return group
        }
        return {
          ...group,
          members: existing.members,
          memberCount: existing.memberCount ?? group.memberCount,
          muted: existing.muted ?? group.muted
        }
      })
      this.loaded = true
      const conversationStore = useConversationStore()
      for (const group of this.groups) {
        conversationStore.updateConversation(ImConversationType.GROUP, group.id, {
          name: group.name,
          avatar: group.avatar,
          muted: group.muted
        })
      }
    },

    /** 单群刷新：用 /im/group/get 拉一份最新元数据再 upsert，常用于 GROUP_UPDATE 推送后或手动 reload */
    async loadGroupInfo(groupId: number) {
      try {
        const data = await apiGetGroup(groupId)
        if (!data) {
          return
        }
        this.upsertGroup(convertGroup(data))
      } catch (e) {
        console.warn('[IM groupStore] loadGroupInfo 失败', e)
      }
    },

    /**
     * 按群拉取成员（带缓存，force=true 强制刷新）
     *
     * 1. 缓存：group 已加载且 members 就绪 → 直接返回
     * 2. 拉取 + 转换：调 /im/group-member/list 后映射成本地 GroupMember
     * 3. 回填当前用户的 muted：
     *    后端只在成员维度返回 muted（apiGetMyGroupList 不带），借这次拉成员把它落到 group / conversation；
     *    否则冷启动 / 清缓存后，服务端已免打扰的群在会话列表里仍显示为未免打扰
     * 4. 落地（关键：race-safe 重新 getGroup）：
     *    apiGetGroupMemberList 期间 loadGroups 可能已经把真实 group 填进 store，
     *    沿用入口快照会让我们错走 4.1 分支、把真实 name 覆盖成 String(groupId)
     *    4.1 group 还没就位（loadGroupMembers 跑在 loadGroups 之前）→ 占位 upsertGroup
     *    4.2 group 已就位 → 直接写 members 字段，并把 muted 单独推回 conversation
     */
    async loadGroupMembers(groupId: number, force = false): Promise<GroupMember[]> {
      // 1. 缓存
      const cached = this.getGroup(groupId)
      if (cached && cached.members && !force) {
        return cached.members
      }

      // 2. 拉取 + 转换
      const list = await apiGetGroupMemberList(groupId)
      const members = (list || []).map((member) => convertGroupMember(member, groupId))

      // 3. 回填 muted
      const userStore = useUserStore()
      const currentUserId = Number(userStore.getUser?.id) || 0
      const me = members.find((m) => m.userId === currentUserId)
      const muted = !!me?.muted

      // 4. 落地（必须 await 之后重新 getGroup，避免踩 race）
      const group = this.getGroup(groupId)
      if (!group) {
        this.upsertGroup({
          id: groupId,
          name: String(groupId),
          members,
          memberCount: members.length,
          muted
        })
      } else {
        group.members = members
        group.memberCount = members.length
        group.muted = muted
        const conversationStore = useConversationStore()
        conversationStore.updateConversation(ImConversationType.GROUP, groupId, { muted })
      }
      return members
    },

    /** 按 id 插入或合并群（命中则浅合并保留旧字段，未命中则追加），同步把 name / avatar / muted 推到对应会话 */
    upsertGroup(group: Group) {
      const index = this.groups.findIndex((g) => g.id === group.id)
      if (index >= 0) {
        this.groups[index] = { ...this.groups[index], ...group }
      } else {
        this.groups.push(group)
      }
      const conversationStore = useConversationStore()
      conversationStore.updateConversation(ImConversationType.GROUP, group.id, {
        name: group.name,
        avatar: group.avatar,
        muted: group.muted
      })
    },

    /** 本地移除（由 WebSocket GROUP_DEL 事件触发） */
    removeGroup(id: number) {
      // 群解散是硬删（区别于好友删除的软删保留记录）；级联清群聊会话避免列表里留死群
      this.groups = this.groups.filter((g) => g.id !== id)
      const conversationStore = useConversationStore()
      conversationStore.removeGroupConversation(id)
    },

    /** 切换免打扰：推后端 + 落本地 */
    async setMuted(id: number, muted: boolean) {
      await apiUpdateGroupMember({ groupId: id, muted })
      const group = this.getGroup(id)
      if (group) {
        group.muted = muted
      }
    },

    /** 切换用户时清空 */
    clear() {
      this.groups = []
      this.loaded = false
    }
  }
})

function convertGroup(vo: ImGroupRespVO): Group {
  return {
    id: vo.id,
    name: vo.name,
    avatar: vo.avatar,
    notice: vo.notice,
    ownerUserId: vo.ownerUserId
  }
}

function convertGroupMember(member: ImGroupMemberRespVO, groupId: number): GroupMember {
  return {
    id: member.id,
    userId: member.userId,
    groupId,
    nickname: member.nickname || String(member.userId),
    avatar: member.avatar,
    displayUserName: member.displayUserName,
    displayGroupName: member.displayGroupName,
    status: member.status,
    muted: member.muted
  }
}

export const useGroupStoreWithOut = () => useGroupStore(store)

// dev: 让 Pinia 的 actions 改动支持 HMR，免去每次改 store 都要硬刷
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGroupStore, import.meta.hot))
}
