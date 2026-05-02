import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import {
  getMyGroupList as apiGetMyGroupList,
  getGroup as apiGetGroup,
  type ImGroupRespVO
} from '@/api/im/group'
import {
  getGroupMember as apiGetGroupMember,
  getGroupMemberList as apiGetGroupMemberList,
  updateGroupMember as apiUpdateGroupMember,
  type ImGroupMemberRespVO
} from '@/api/im/group/member'
import { useConversationStore } from './conversationStore'
import { ImConversationType, ImGroupMemberRole } from '../../utils/constants'
import {
  getCurrentUserId,
  imStorage,
  removeQuietly,
  setQuietly,
  StorageKeys
} from '../../utils/storage'
import { getGroupDisplayName } from '../../utils/user'
import type { Group, GroupMember } from '../types'

/**
 * fetchGroupMembers 并发去重表：同 groupId 同时进的请求共用一个 Promise
 *
 * key 必须带 userId——账号切换时 A 的请求不能被 B 复用，否则 IIFE 内部的 saveGroupMembers 会把 A 的成员数据写进 B 的 IDB 桶
 */
const pendingMemberFetches = new Map<string, Promise<GroupMember[]>>()
const pendingMemberKey = (userId: number, groupId: number) => `${userId}:${groupId}`

/**
 * fetchGroupMember 单成员并发去重表：同 (groupId, memberUserId) 同时进的请求共用一个 Promise
 *
 * 跟整群表分开：单成员 fetch 跟整群 fetch 语义不同（单成员不回填 me 的 muted），不能互相代替
 */
const pendingSingleMemberFetches = new Map<string, Promise<GroupMember | null>>()
const pendingSingleMemberKey = (userId: number, groupId: number, memberUserId: number) =>
  `${userId}:${groupId}:${memberUserId}`

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
    // 仅 fetchGroups 成功后置位；loadGroups（IDB）不置位，否则后台 SWR 刷新会被缓存命中跳过
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

    /** 从 IDB 恢复群列表（不带 members），返回是否命中缓存 */
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
      setQuietly(
        StorageKeys.groups(userId),
        groupsWithoutMembers,
        '[IM groupStore] 本地群缓存写入失败'
      )
    },

    /** 从 IDB 恢复指定群成员；命中返回成员数组，未命中返回 null */
    async loadGroupMembers(groupId: number): Promise<GroupMember[] | null> {
      const userId = getCurrentUserId()
      if (!userId) {
        return null
      }
      // in-memory 已"完整"加载（fetchGroupMembers 跑过或上次冷启动从 IDB 整桶恢复过）：直接复用；
      // 单成员补齐（fetchGroupMember）写进的 partial members 不在此返回缓存——其 membersLoaded=false
      const cachedGroup = this.getGroup(groupId)
      if (cachedGroup?.members && cachedGroup.membersLoaded) {
        return cachedGroup.members
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
          // group 还没就位：仅 in-memory 占位（name='' 表示未知），不调 upsertGroup —— 避免把假名灌进 conversation.name + groups IDB 桶；
          // 后续，等 fetchGroups 浅合并时，被真名覆盖
          this.groups.push({
            id: groupId,
            name: '',
            members: cached,
            memberCount: cached.length,
            membersLoaded: true
          })
        } else {
          group.members = cached
          group.memberCount = cached.length
          group.membersLoaded = true
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
      setQuietly(
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
      // 合并而非全量替换：muted / groupRemark / 成员缓存这些字段不在 ImGroupRespVO 里，得从旧 group 保留
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
          muted: existing.muted ?? group.muted,
          groupRemark: existing.groupRemark,
          membersLoaded: existing.membersLoaded
        }
      })
      this.loaded = true
      const conversationStore = useConversationStore()
      for (const group of this.groups) {
        conversationStore.updateConversation(ImConversationType.GROUP, group.id, {
          name: getGroupDisplayName(group),
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

    /** 按群拉取成员（in-memory 缓存 + 并发去重，force=true 强刷）+ 落 IDB */
    fetchGroupMembers(groupId: number, force = false): Promise<GroupMember[]> {
      // in-memory "完整"加载过才命中——单成员补齐写入的 partial members 不在此返回（membersLoaded=false）
      const cached = this.getGroup(groupId)
      if (cached && cached.members && cached.membersLoaded && !force) {
        return Promise.resolve(cached.members)
      }
      // 未登录：不发起请求也不登记 in-flight，避免污染单飞表
      const requestUserId = getCurrentUserId()
      if (!requestUserId) {
        return Promise.resolve([])
      }
      // 同 (userId, groupId) 已经有正在飞的请求：直接复用，避免重复打接口
      const key = pendingMemberKey(requestUserId, groupId)
      const inflight = pendingMemberFetches.get(key)
      if (inflight) {
        return inflight
      }
      const promise = (async () => {
        // 拉接口 + 单 pass 转换：同时捕获 me 的原始 VO，给下面回填 user-per-group 字段（muted / groupRemark）用
        const list = await apiGetGroupMemberList(groupId)
        let meRaw: ImGroupMemberRespVO | undefined
        const members = (list || []).map((member) => {
          if (member.userId === requestUserId) {
            meRaw = member
          }
          return convertGroupMember(member, groupId)
        })
        const muted = !!meRaw?.muted
        const groupRemark = meRaw?.groupRemark || ''

        // 必须 await 之后重新 getGroup，避免 fetchGroups 已并发写入真实 group 的 race
        const group = this.getGroup(groupId)
        const isPlaceholder = !group
        let groupFieldsChanged = false
        if (!group) {
          // group 还没就位：仅 in-memory push 占位（name='' 表示未知），不调 upsertGroup——避免把假名灌进 conversation.name + groups IDB 桶；
          // 后续，等 fetchGroups 浅合并时，被真名覆盖
          this.groups.push({
            id: groupId,
            name: '',
            members,
            memberCount: members.length,
            muted,
            groupRemark,
            membersLoaded: true
          })
        } else {
          group.members = members
          group.memberCount = members.length
          group.membersLoaded = true
          // muted / groupRemark 任一变化才同步到 conversation 和 IDB；groupRemark 变化要顺带刷会话名
          if (group.muted !== muted || group.groupRemark !== groupRemark) {
            group.muted = muted
            group.groupRemark = groupRemark
            groupFieldsChanged = true
            const conversationStore = useConversationStore()
            conversationStore.updateConversation(ImConversationType.GROUP, groupId, {
              name: getGroupDisplayName(group),
              muted
            })
          }
        }

        // groups 桶仅在 user-per-group 字段实际变化时写——避免一次批量进群引发多次整桶重写
        this.saveGroupMembers(groupId)
        if (!isPlaceholder && groupFieldsChanged) {
          this.saveGroups()
        }
        return members
        // 无论成功 / 失败都要从单飞表清掉，否则后续同 group 请求永远拿到这个 stale Promise
      })().finally(() => pendingMemberFetches.delete(key))

      // 把 Promise 登记进单飞表，让此后短时间内的同 (userId, groupId) 请求复用
      pendingMemberFetches.set(key, promise)
      return promise
    },

    /**
     * 按 (groupId, memberUserId) 单成员补齐——deriveLastSenderDisplayName 兜底场景用
     *
     * 跟 fetchGroupMembers 区别：只拉这一个成员，不动 me 的 muted / groupRemark（不是 me 的话拿不到）；
     * 命中时把成员 upsert 进 group.members 数组并落 IDB，让后续渲染能用 displayUserName
     */
    fetchGroupMember(groupId: number, memberUserId: number): Promise<GroupMember | null> {
      // in-memory 命中直接返回，不打接口
      const cached = this.getGroup(groupId)?.members?.find((m) => m.userId === memberUserId)
      if (cached) {
        return Promise.resolve(cached)
      }
      // 未登录：不发起请求也不登记 in-flight，避免污染单飞表
      const requestUserId = getCurrentUserId()
      if (!requestUserId) {
        return Promise.resolve(null)
      }
      // 同 (userId, groupId, memberUserId) 已经有正在飞的请求：直接复用
      const key = pendingSingleMemberKey(requestUserId, groupId, memberUserId)
      const inflight = pendingSingleMemberFetches.get(key)
      if (inflight) {
        return inflight
      }
      const promise = (async () => {
        const data = await apiGetGroupMember(groupId, memberUserId)
        if (!data) {
          return null
        }
        const member = convertGroupMember(data, groupId)
        // 把这一条 upsert 进 group.members 仅供 in-memory 渲染兜底；group 还没就位则用 placeholder
        // 注意：不写 IDB——成员桶语义是"全量"，存"1 人桶"会污染下次冷启动的 loadGroupMembers
        const group = this.getGroup(groupId)
        if (!group) {
          // memberCount 不设：后续 fetchGroups 合并 `existing.memberCount ?? fresh.memberCount` 时，
          // 占位值会顶替真实值（fresh 不带 memberCount），等 fetchGroupMembers 跑过才能拿到真实数
          this.groups.push({
            id: groupId,
            name: '',
            members: [member]
          })
        } else {
          const memberList = group.members ?? []
          const index = memberList.findIndex((m) => m.userId === memberUserId)
          if (index >= 0) {
            memberList[index] = member
          } else {
            memberList.push(member)
          }
          group.members = memberList
        }
        return member
      })().finally(() => pendingSingleMemberFetches.delete(key))
      pendingSingleMemberFetches.set(key, promise)
      return promise
    },

    /** 按 id 插入或合并群（命中则浅合并保留旧字段，未命中则追加），同步把展示名 / 头像 / 免打扰推到对应会话 */
    upsertGroup(group: Group) {
      const index = this.groups.findIndex((g) => g.id === group.id)
      if (index >= 0) {
        this.groups[index] = { ...this.groups[index], ...group }
      } else {
        this.groups.push(group)
      }
      // 同步推到 conversation：群名 / 头像 / 免打扰是会话列表展示用的，必须紧随 group 变更
      const merged = this.getGroup(group.id) ?? group
      const conversationStore = useConversationStore()
      conversationStore.updateConversation(ImConversationType.GROUP, group.id, {
        name: getGroupDisplayName(merged),
        avatar: merged.avatar,
        muted: merged.muted
      })
      // 持久化到 IDB（fire-and-forget）
      this.saveGroups()
    },

    /** 本地移除（由 WebSocket GROUP_DEL 事件触发） */
    removeGroup(id: number) {
      // 群解散是硬删（区别于好友删除的软删保留记录）；级联清群聊会话避免列表里留死群
      this.groups = this.groups.filter((g) => g.id !== id)
      const conversationStore = useConversationStore()
      conversationStore.removeGroupConversation(id)
      this.saveGroups()
      // 群解散后顺手删 IDB 里该群的成员桶——这桶仅靠 groupId 索引，不删会一直留在 IDB 占空间
      const userId = getCurrentUserId()
      if (userId) {
        removeQuietly(
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

    /** 批量更新群成员角色；本地不命中则忽略，等 fetchGroupMembers 兜底 */
    updateMembersRole(groupId: number, userIds: number[], role: number) {
      const group = this.getGroup(groupId)
      if (!group?.members?.length) {
        return
      }
      // TODO @AI：计算是否更新？【优化注释】
      const idSet = new Set(userIds)
      let changed = false
      // TODO @AI：newMembers 更合适？
      // TODO @AI：m 是不是改成 member；
      const next = group.members.map((m) => {
        if (!idSet.has(m.userId) || m.role === role) {
          return m
        }
        changed = true
        return { ...m, role }
      })
      // TODO @AI：有更新则进行替换，补充下注释【优化注释】
      if (changed) {
        group.members = next
      }
    },

    /** 群主转让：群表 ownerUserId 改为新值；旧群主 role → NORMAL；新群主 role → OWNER */
    transferOwner(groupId: number, oldOwnerId: number, newOwnerId: number) {
      const group = this.getGroup(groupId)
      if (!group) {
        return
      }
      if (group.ownerUserId !== newOwnerId) {
        group.ownerUserId = newOwnerId
      }
      this.updateMembersRole(groupId, [oldOwnerId], ImGroupMemberRole.NORMAL)
      this.updateMembersRole(groupId, [newOwnerId], ImGroupMemberRole.OWNER)
      this.saveGroups()
    },

    /** 切账号时仅清 in-memory，IDB 按 userId 分桶天然隔离，回切秒开 */
    clear() {
      this.groups = []
      this.loaded = false
      // 单飞表跟 in-memory state 一起重置；旧账号 in-flight 的请求 finally 也会自己 delete key，提前清空只是更干脆
      pendingMemberFetches.clear()
      pendingSingleMemberFetches.clear()
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
    status: member.status,
    role: member.role
  }
}

export const useGroupStoreWithOut = () => useGroupStore(store)

// dev: 让 Pinia 的 actions 改动支持 HMR，免去每次改 store 都要硬刷
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGroupStore, import.meta.hot))
}
