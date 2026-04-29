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
import { useConversationStore } from './conversationStore'
import { ImConversationType } from '../../utils/constants'
import {
  getCurrentUserId,
  imStorage,
  safeImRemove,
  safeImSet,
  StorageKeys
} from '../../utils/storage'
import type { Group, GroupMember } from '../types'

/**
 * fetchGroupMembers 单飞表：同 groupId 并发只打一次接口
 *
 * key 必须带 userId——账号切换时 A 的 in-flight 不能被 B 复用，否则 IIFE 内部
 * 的 saveGroupMembers 会把 A 的成员数据写进 B 的 IDB 桶
 */
const pendingMemberFetches = new Map<string, Promise<GroupMember[]>>()
const pendingMemberKey = (userId: number, groupId: number) => `${userId}:${groupId}`

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
    // 仅 fetchGroups 成功后置位；loadGroups（IDB）不置位，否则后台 SWR 刷新会被短路
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
    // ==================== 本地缓存 ====================

    // TODO @AI：简化注释，参考 friendStore；
    /**
     * 从 IDB 恢复群列表（不带 members），返回 boolean 给首屏 SWR 决策用
     *
     * 不更新 conversationStore——会话缓存和群缓存是同一会话写入的，名字头像天然一致
     */
    async loadGroups(): Promise<boolean> {
      const userId = getCurrentUserId()
      if (!userId) {
        return false
      }
      try {
        const cached = await imStorage.getItem<Group[]>(StorageKeys.groups(userId))
        if (!cached || cached.length === 0) {
          return false
        }
        this.groups = cached
        return true
      } catch (e) {
        console.warn('[IM groupStore] 本地群缓存读取失败', e)
        return false
      }
    },

    /** 整桶持久化群列表；剥离 members 字段，成员另走 groupMembers:${groupId} 分桶 */
    saveGroups(): void {
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      const groupsWithoutMembers = this.groups.map(({ members, ...rest }) => rest)
      safeImSet(
        StorageKeys.groups(userId),
        groupsWithoutMembers,
        '[IM groupStore] 本地群缓存写入失败'
      )
    },

    // TODO @AI：命中返回数组（caller 紧接渲染省一次二次访问），未命中返回 null 是不是没必要注释？只是说返回结果而已。。。
    /** 从 IDB 恢复指定群成员；命中返回数组（caller 紧接渲染省一次二次访问），未命中返回 null */
    async loadGroupMembers(groupId: number): Promise<GroupMember[] | null> {
      const userId = getCurrentUserId()
      if (!userId) {
        return null
      }
      // in-memory 已就位（同会话二次进群 / fetchGroupMembers 已跑过）：直接复用
      const cachedInMemory = this.getGroup(groupId)?.members
      if (cachedInMemory && cachedInMemory.length > 0) {
        return cachedInMemory
      }
      try {
        const cached = await imStorage.getItem<GroupMember[]>(
          StorageKeys.groupMembers(userId, groupId)
        )
        if (!cached || cached.length === 0) {
          return null
        }
        // 把 IDB 拿到的成员落到对应 group
        const group = this.getGroup(groupId)
        if (!group) {
          // group 还没就位：仅 in-memory 占位（name='' 表示未知），不调 upsertGroup 。
          // 原因：避免把假名灌进 conversation.name + groups IDB 桶；等 fetchGroups 浅合并时被真名覆盖
          this.groups.push({
            id: groupId,
            name: '',
            members: cached,
            memberCount: cached.length
          })
        } else {
          group.members = cached
          group.memberCount = cached.length
        }
        return cached
      } catch (e) {
        console.warn('[IM groupStore] 本地群成员缓存读取失败', { groupId }, e)
        return null
      }
    },

    /** 整桶持久化指定群成员 */
    saveGroupMembers(groupId: number): void {
      const userId = getCurrentUserId()
      if (!userId) {
        return
      }
      const members = this.getGroup(groupId)?.members
      if (!members) {
        return
      }
      safeImSet(
        StorageKeys.groupMembers(userId, groupId),
        members,
        `[IM groupStore] 本地群成员缓存写入失败 (groupId=${groupId})`
      )
    },

    // ==================== 远端拉取 ====================

    /** 拉取群列表；同步刷新对应群聊会话的展示名 / 头像 + 落 IDB */
    async fetchGroups(force = false) {
      if (this.loaded && !force) {
        return
      }
      // 拉取当前登录用户加入的所有群（不带成员；成员按需再走 fetchGroupMembers）
      const list = await apiGetMyGroupList()
      const fresh = (list || []).map(convertGroup)
      // 合并而非全量替换：保留 loadGroupMembers / fetchGroupMembers 已经写入的 members / memberCount / muted
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
      this.saveGroups()
    },

    /** 单群刷新：用 /im/group/get 拉一份最新元数据再 upsert，常用于 GROUP_UPDATE 推送后或手动 reload */
    async fetchGroupInfo(groupId: number) {
      try {
        const data = await apiGetGroup(groupId)
        if (!data) {
          return
        }
        this.upsertGroup(convertGroup(data))
      } catch (e) {
        console.warn('[IM groupStore] fetchGroupInfo 失败', e)
      }
    },

    // TODO @AI：in-flight 单飞；这个注释有点奇怪
    /** 按群拉取成员（in-memory 缓存 + in-flight 单飞，force=true 强刷）+ 落 IDB */
    fetchGroupMembers(groupId: number, force = false): Promise<GroupMember[]> {
      const cached = this.getGroup(groupId)
      if (cached && cached.members && !force) {
        return Promise.resolve(cached.members)
      }
      const requestUserId = getCurrentUserId()
      if (!requestUserId) {
        return Promise.resolve([])
      }
      // TODO @AI：最好这里注释下。
      const key = pendingMemberKey(requestUserId, groupId)
      const inflight = pendingMemberFetches.get(key)
      if (inflight) {
        return inflight
      }
      const promise = (async () => {
        // TODO @AI：这里是不是要注释下
        const list = await apiGetGroupMemberList(groupId)
        const members = (list || []).map((member) => convertGroupMember(member, groupId))
        // 网络往返期间用户可能已切——A 的数据写到 B 的 store / IDB 是数据互串，丢弃
        // TODO @AI：这个应该不存在把？有点过度设计了。
        if (getCurrentUserId() !== requestUserId) {
          return []
        }

        // muted 是成员维度字段（apiGetMyGroupList 不带），借这次拉成员回填到 group / conversation
        const me = members.find((m) => m.userId === requestUserId)
        const muted = !!me?.muted

        // 必须 await 之后重新 getGroup，避免 fetchGroups 已并发写入真实 group 的 race
        const group = this.getGroup(groupId)
        const isPlaceholder = !group
        let mutedChanged = false
        if (!group) {
          // group 还没就位：仅 in-memory push 占位（name='' 表示未知），不调 upsertGroup
          // 避免把假名灌进 conversation.name + groups IDB 桶。等 fetchGroups 浅合并时被真名覆盖
          this.groups.push({
            id: groupId,
            name: '',
            members,
            memberCount: members.length,
            muted
          })
        } else {
          group.members = members
          group.memberCount = members.length
          // TODO @AI：这里最好注释下。
          if (group.muted !== muted) {
            group.muted = muted
            mutedChanged = true
            const conversationStore = useConversationStore()
            conversationStore.updateConversation(ImConversationType.GROUP, groupId, { muted })
          }
        }

        // TODO @AI：“避免批量进群 fan-out 时重复重写整桶”调整下。fan-out 不太好理解。
        // groups 桶仅在 muted 实际变化时写——避免批量进群 fan-out 时重复重写整桶
        this.saveGroupMembers(groupId)
        if (!isPlaceholder && mutedChanged) {
          this.saveGroups()
        }
        return members
        // TODO @AI：finally 最注释下，好理解；
      })().finally(() => pendingMemberFetches.delete(key))

      // TODO @AI：这里是不是要注释下
      pendingMemberFetches.set(key, promise)
      return promise
    },

    /** 按 id 插入或合并群（命中则浅合并保留旧字段，未命中则追加），同步把 name / avatar / muted 推到对应会话 */
    upsertGroup(group: Group) {
      const index = this.groups.findIndex((g) => g.id === group.id)
      if (index >= 0) {
        this.groups[index] = { ...this.groups[index], ...group }
      } else {
        this.groups.push(group)
      }
      // TODO @AI：这里注释下
      const conversationStore = useConversationStore()
      conversationStore.updateConversation(ImConversationType.GROUP, group.id, {
        name: group.name,
        avatar: group.avatar,
        muted: group.muted
      })
      // TODO @AI：这里注释下
      this.saveGroups()
    },

    /** 本地移除（由 WebSocket GROUP_DEL 事件触发） */
    removeGroup(id: number) {
      // 群解散是硬删（区别于好友删除的软删保留记录）；级联清群聊会话避免列表里留死群
      this.groups = this.groups.filter((g) => g.id !== id)
      const conversationStore = useConversationStore()
      conversationStore.removeGroupConversation(id)
      this.saveGroups()
      // TODO @AI：避免 IDB 留 orphan；注释调整下，orphan 有点不好理解。
      // 把对应的群成员桶物理删掉，避免 IDB 留 orphan
      const userId = getCurrentUserId()
      if (userId) {
        safeImRemove(
          StorageKeys.groupMembers(userId, id),
          `[IM groupStore] 群成员缓存删除失败 (groupId=${id})`
        )
      }
    },

    /** 切换免打扰：推后端 + 落本地 */
    async setMuted(id: number, muted: boolean) {
      await apiUpdateGroupMember({ groupId: id, muted })
      const group = this.getGroup(id)
      if (!group) {
        return
      }
      group.muted = muted
      this.saveGroups()
    },

    /** 切账号时仅清 in-memory，IDB 按 userId 分桶天然隔离，回切秒开 */
    clear() {
      this.groups = []
      this.loaded = false
      // TODO @AI：in-flight 这种调整下，不好理解。
      // 旧账号的 in-flight 即便 resolve 也会被 IIFE 内部的 userId 校验丢弃，索性清掉避免悬挂
      pendingMemberFetches.clear()
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
