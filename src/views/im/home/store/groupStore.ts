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
import { useGroupRequestStore } from './groupRequestStore'
import {
  ImConversationType,
  ImGroupMemberRole,
  ImMessageStatus,
  ImContentType
} from '../../utils/constants'
import { CommonStatusEnum } from '@/utils/constants'
import { getDb } from '../../utils/db'
import { getCurrentUserId } from '@/utils/auth'
import { getGroupDisplayName } from '../../utils/user'
import { type GroupNotificationPayload } from '../../utils/message'
import type { Group, GroupDO, GroupMember, GroupMemberDO, Message } from '../types'

/** clear() 时递增；旧账号 in-flight 的成员请求返回后比对一致才写 store */
let storeEpoch = 0

/**
 * fetchGroupMemberList 并发去重表：同 groupId 同时进的请求共用一个 Promise
 *
 * key 必须带 userId——账号切换时 A 的请求不能被 B 复用，否则 IIFE 内部的 saveGroupMemberList 会把 A 的成员数据写进 B 的 IDB 桶
 */
const pendingMemberFetches = new Map<string, Promise<GroupMember[]>>()
const pendingMemberKey = (userId: number, groupId: number) => `${userId}:${groupId}`

/**
 * fetchGroupMember 单成员并发去重表：同 (groupId, memberUserId) 同时进的请求共用一个 Promise
 *
 * 跟整群表分开：单成员 fetch 跟整群 fetch 语义不同（单成员不回填 me 的 silent），不能互相代替
 */
const pendingSingleMemberFetches = new Map<string, Promise<GroupMember | null>>()

const pendingSingleMemberKey = (userId: number, groupId: number, memberUserId: number) =>
  `${userId}:${groupId}:${memberUserId}`

/** 构建群 IndexedDB 记录 */
function buildGroupDO(group: Group): GroupDO {
  const {
    activeCallExpired: _activeCallExpired,
    activeCallLoaded: _activeCallLoaded,
    infoLoaded: _infoLoaded,
    members: _members,
    membersLoaded: _membersLoaded,
    membersExpired: _membersExpired,
    ...record
  } = group
  return record
}

/** 判断当前用户是否在 payload.memberUserIds 里（GROUP_CREATE / INVITE / KICK 自判用） */
function isSelfInPayloadMembers(payload: GroupNotificationPayload): boolean {
  const selfUserId = getCurrentUserId()
  return !!selfUserId && (payload.memberUserIds || []).includes(selfUserId)
}

/** 刷新我管理的群申请红点 */
function refreshUnhandledGroupRequests(): void {
  useGroupRequestStore()
    .fetchUnhandledGroupRequestList()
    .catch(() => undefined)
}

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
    loaded: false, // 仅 fetchGroupList 成功后置位；loadGroupList（IDB）不置位，否则后台 SWR 刷新会被缓存命中跳过
    groupMembersExpired: false // 进入 IM / 重连后置位；IDB 里的成员桶延迟加载到内存时，也要按过期处理
  }),

  getters: {
    getGroup:
      (state) =>
      (id: number): Group | undefined => {
        return state.groups.find((g) => g.id === id)
      },
    /** 群成员 userId → GroupMember 索引；调用方按 userId 反查昵称 / 头像等元信息 */
    getGroupMemberMap:
      (state) =>
      (id: number): Map<number, GroupMember> => {
        const group = state.groups.find((g) => g.id === id)
        return new Map((group?.members || []).map((m) => [m.userId, m]))
      }
  },

  actions: {
    // ==================== 本地缓存 ====================

    /** 从 IndexedDB 恢复群列表 */
    async loadGroupList(): Promise<boolean> {
      try {
        const cached = await getDb().getAll<GroupDO>('groups')
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

    /** 保存群列表 */
    saveGroupList(): void {
      void getDb()
        .transaction(['groups'], 'readwrite', async (tx) => {
          const db = getDb()
          await db.clearStore('groups', tx)
          for (const group of this.groups) {
            await db.put('groups', buildGroupDO(group), tx)
          }
        })
        .catch((e) => console.warn('[IM groupStore] 本地群缓存写入失败', e))
    },

    /** 保存单个群 */
    async saveGroupRecord(group: Group | undefined): Promise<void> {
      if (!group) {
        return
      }
      await getDb().put('groups', buildGroupDO(group))
    },

    /** 保存单个群 */
    saveGroup(group: Group | undefined): void {
      void this.saveGroupRecord(group).catch((e) =>
        console.warn('[IM groupStore] 本地群写入失败', e)
      )
    },

    /** 从 IndexedDB 恢复指定群成员 */
    async loadGroupMemberList(groupId: number): Promise<GroupMember[] | null> {
      // in-memory 已"完整"加载（fetchGroupMemberList 跑过或上次冷启动从 IDB 整桶恢复过）：直接复用；
      // 单成员补齐（fetchGroupMember）写进的 partial members 不在此返回缓存——其 membersLoaded=false
      const cachedGroup = this.getGroup(groupId)
      if (cachedGroup?.members && cachedGroup.membersLoaded) {
        return cachedGroup.members
      }
      try {
        const cached = await getDb().getAllByIndex<GroupMemberDO>(
          'groupMembers',
          'groupId',
          groupId
        )
        if (!cached || cached.length === 0) {
          return null
        }
        // 把 IDB 拿到的成员落到对应 group
        const group = this.getGroup(groupId)
        if (!group) {
          // group 还没就位：仅 in-memory 占位（name='' 表示未知），不调 upsertGroup —— 避免把假名灌进 conversation.name + groups IDB 桶；
          // 后续，等 fetchGroupList 浅合并时，被真名覆盖
          this.groups.push({
            id: groupId,
            name: '',
            members: cached,
            memberCount: cached.length,
            membersLoaded: true,
            membersExpired: this.groupMembersExpired
          })
        } else {
          group.members = cached
          group.memberCount = cached.length
          group.membersLoaded = true
          group.membersExpired = this.groupMembersExpired
        }
        return cached
      } catch (e) {
        console.warn('[IM groupStore] 本地群成员缓存读取失败', { groupId }, e)
        return null
      }
    },

    /** 保存指定群成员 */
    saveGroupMemberList(groupId: number): void {
      const members = this.getGroup(groupId)?.members
      if (!members) {
        return
      }
      void getDb()
        .transaction(['groupMembers'], 'readwrite', async (tx) => {
          const db = getDb()
          await db.deleteByIndex('groupMembers', 'groupId', groupId, tx)
          for (const member of members) {
            if (member.id) {
              await db.put('groupMembers', member, tx)
            }
          }
        })
        .catch((e) =>
          console.warn(`[IM groupStore] 本地群成员缓存写入失败 (groupId=${groupId})`, e)
        )
    },

    // ==================== 远端拉取 ====================

    /** 拉取群列表；同步刷新对应群聊会话的展示名 / 头像 + 落 IDB */
    async fetchGroupList(force = false) {
      if (this.loaded && !force) {
        return
      }
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      // 拉取当前登录用户加入的所有群（不带成员；成员按需再走 fetchGroupMemberList）
      const list = await apiGetMyGroupList()
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      const fresh = (list || []).map((group) => convertGroup(group))
      // 合并而非全量替换：成员缓存只在成员列表接口维护，群个人设置以群列表接口为准
      const groupMap = new Map(this.groups.map((group) => [group.id, group]))
      this.groups = fresh.map((group) => {
        const existing = groupMap.get(group.id)
        if (!existing) {
          return { ...group, activeCallExpired: true, infoLoaded: true }
        }
        return {
          ...group,
          infoLoaded: true,
          activeCallExpired: existing.activeCallExpired,
          activeCallLoaded: existing.activeCallLoaded,
          members: existing.members,
          memberCount: existing.memberCount ?? group.memberCount,
          membersLoaded: existing.membersLoaded,
          membersExpired: existing.membersExpired
        }
      })
      this.loaded = true
      const conversationStore = useConversationStore()
      for (const group of this.groups) {
        conversationStore.updateConversation(ImConversationType.GROUP, group.id, {
          name: getGroupDisplayName(group),
          avatar: group.avatar,
          silent: group.silent
        })
      }
      this.saveGroupList()
      this.preloadMembersForEmptyAvatarGroups()
    },

    /** 预加载空群头像的成员列表，供 GroupAvatar 异步合成群头像 */
    preloadMembersForEmptyAvatarGroups() {
      for (const group of this.groups) {
        if (
          group.avatar ||
          group.joinStatus === CommonStatusEnum.DISABLE ||
          (group.membersLoaded && !group.membersExpired && group.members?.length)
        ) {
          continue
        }
        const force = !!group.membersLoaded && !group.membersExpired && !group.members?.length
        this.fetchGroupMemberList(group.id, force).catch((error) => {
          console.warn('[IM groupStore] 预加载群头像成员失败', { groupId: group.id }, error)
        })
      }
    },

    /** 失效全部群详情缓存 */
    markAllGroupInfoExpired() {
      for (const group of this.groups) {
        group.infoLoaded = false
      }
    },

    /** 失效全部群成员缓存 */
    markAllGroupMembersExpired() {
      this.groupMembersExpired = true
      for (const group of this.groups) {
        if (group.membersLoaded) {
          group.membersExpired = true
        }
      }
    },

    /** 失效全部群通话探测缓存 */
    markAllGroupActiveCallsExpired() {
      for (const group of this.groups) {
        group.activeCallExpired = true
      }
    },

    /** 标记群通话探测已加载 */
    markGroupActiveCallLoaded(groupId: number) {
      const group = this.getGroup(groupId)
      if (!group) {
        return
      }
      group.activeCallLoaded = true
      group.activeCallExpired = false
    },

    /** 判断群通话是否需要重新探测 */
    isGroupActiveCallExpired(groupId: number): boolean {
      const group = this.getGroup(groupId)
      return !group?.activeCallLoaded || !!group.activeCallExpired
    },

    /** 失效指定群成员缓存 */
    markGroupMembersExpired(groupId: number) {
      const group = this.getGroup(groupId)
      if (group?.membersLoaded) {
        group.membersExpired = true
      }
    },

    /** 单群刷新：用 /im/group/get 拉一份最新元数据再 upsert，常用于 GROUP_UPDATE 推送后或手动 reload */
    async fetchGroupInfo(groupId: number, force = false) {
      const cached = this.getGroup(groupId)
      if (cached?.infoLoaded && !force) {
        return
      }
      try {
        const data = await apiGetGroup(groupId)
        if (!data) {
          return
        }
        this.upsertGroup({ ...convertGroup(data), infoLoaded: true })
      } catch (e) {
        console.warn('[IM groupStore] fetchGroupInfo 失败', e)
      }
    },

    /** 按群拉取成员（in-memory 缓存 + 并发去重，force=true 强刷）+ 落 IDB */
    fetchGroupMemberList(groupId: number, force = false): Promise<GroupMember[]> {
      // in-memory "完整"加载过才命中——单成员补齐写入的 partial members 不在此返回（membersLoaded=false）
      const cached = this.getGroup(groupId)
      if (cached && cached.members && cached.membersLoaded && !cached.membersExpired && !force) {
        return Promise.resolve(cached.members)
      }
      // 未登录：不发起请求也不登记 in-flight，避免污染单飞表
      const requestUserId = getCurrentUserId()
      if (!requestUserId) {
        return Promise.resolve([])
      }
      const requestEpoch = storeEpoch
      // 同 (userId, groupId) 已经有正在飞的请求：直接复用，避免重复打接口
      const key = pendingMemberKey(requestUserId, groupId)
      const inflight = pendingMemberFetches.get(key)
      if (inflight) {
        return inflight
      }
      const promise = (async () => {
        // 拉接口 + 单 pass 转换：同时捕获 me 的原始 VO，给下面回填 user-per-group 字段（silent / groupRemark）用
        const list = await apiGetGroupMemberList(groupId)
        if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
          return []
        }
        let meRaw: ImGroupMemberRespVO | undefined
        const members = (list || []).map((member) => {
          if (member.userId === requestUserId) {
            meRaw = member
          }
          return convertGroupMember(member, groupId)
        })
        const silent = !!meRaw?.silent
        const groupRemark = meRaw?.groupRemark || ''

        // 必须 await 之后重新 getGroup，避免 fetchGroupList 已并发写入真实 group 的 race
        const group = this.getGroup(groupId)
        const isPlaceholder = !group
        let groupFieldsChanged = false
        if (!group) {
          // group 还没就位：仅 in-memory push 占位（name='' 表示未知），不调 upsertGroup——避免把假名灌进 conversation.name + groups IDB 桶；
          // 后续，等 fetchGroupList 浅合并时，被真名覆盖
          this.groups.push({
            id: groupId,
            name: '',
            members,
            memberCount: members.length,
            silent,
            groupRemark,
            membersLoaded: true,
            membersExpired: false
          })
        } else {
          group.members = members
          group.memberCount = members.length
          group.membersLoaded = true
          group.membersExpired = false
          // silent / groupRemark 任一变化才同步到 conversation 和 IDB；groupRemark 变化要顺带刷会话名
          if (group.silent !== silent || group.groupRemark !== groupRemark) {
            group.silent = silent
            group.groupRemark = groupRemark
            groupFieldsChanged = true
            const conversationStore = useConversationStore()
            conversationStore.updateConversation(ImConversationType.GROUP, groupId, {
              name: getGroupDisplayName(group),
              silent
            })
          }
        }

        // groups 桶仅在 user-per-group 字段实际变化时写——避免一次批量进群引发多次整桶重写
        this.saveGroupMemberList(groupId)
        if (!isPlaceholder && groupFieldsChanged) {
          this.saveGroup(group)
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
     * 跟 fetchGroupMemberList 区别：只拉这一个成员，不动 me 的 silent / groupRemark（不是 me 的话拿不到）；
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
      const requestEpoch = storeEpoch
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
        if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
          return null
        }
        const member = convertGroupMember(data, groupId)
        // 把这一条 upsert 进 group.members 仅供 in-memory 渲染兜底；group 还没就位则用 placeholder
        // 注意：不写 IDB——成员桶语义是"全量"，存"1 人桶"会污染下次冷启动的 loadGroupMemberList
        const group = this.getGroup(groupId)
        if (!group) {
          // memberCount 不设：后续 fetchGroupList 合并 `existing.memberCount ?? fresh.memberCount` 时，
          // 占位值会顶替真实值（fresh 不带 memberCount），等 fetchGroupMemberList 跑过才能拿到真实数
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
      void this.upsertGroupAndSave(group).catch((e) =>
        console.warn('[IM groupStore] 本地群写入失败', e)
      )
    },

    /** 按 id 插入或合并群 */
    async upsertGroupAndSave(group: Group): Promise<void> {
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
        silent: merged.silent
      })
      // 持久化到 IDB（fire-and-forget）
      await this.saveGroupRecord(merged)
    },

    /** 本地移除群缓存和群会话；群解散（GROUP_DEL）、退群、被踢都复用 */
    removeGroup(id: number) {
      // 本地硬删（区别于好友删除的软删保留记录）；级联清群聊会话避免列表里留死群
      this.groups = this.groups.filter((g) => g.id !== id)
      const conversationStore = useConversationStore()
      conversationStore.removeGroupConversation(id)
      void getDb()
        .transaction(['groups', 'groupMembers'], 'readwrite', async (tx) => {
          const db = getDb()
          await db.delete('groups', id, tx)
          await db.deleteByIndex('groupMembers', 'groupId', id, tx)
        })
        .catch((e) => console.warn(`[IM groupStore] 群缓存删除失败 (groupId=${id})`, e))
    },

    /** 切换免打扰：推后端 + 落本地 + 同步会话列表的 silent，避免 silent 图标 / 总未读 / 提示音判断与设置漂移；和 friendStore.setFriendSilent 对齐 */
    async setGroupSilent(id: number, silent: boolean) {
      await apiUpdateGroupMember({ groupId: id, silent })
      const group = this.getGroup(id)
      if (!group) {
        return
      }
      group.silent = silent
      const conversationStore = useConversationStore()
      conversationStore.updateConversation(ImConversationType.GROUP, id, { silent })
      this.saveGroup(group)
    },

    /** 批量更新群成员角色；本地不命中则忽略，等 fetchGroupMemberList 兜底 */
    updateGroupMemberRoleList(groupId: number, userIds: number[], role: number) {
      const group = this.getGroup(groupId)
      if (!group?.members?.length) {
        return
      }
      // 命中目标且角色已变化才标记 changed，避免无变化时整数组重建触发响应式
      const idSet = new Set(userIds)
      let changed = false
      const newMembers = group.members.map((member) => {
        if (!idSet.has(member.userId) || member.role === role) {
          return member
        }
        changed = true
        return { ...member, role }
      })
      // 有变化才整组替换，让响应式只在真有更新时通知下游
      if (changed) {
        group.members = newMembers
        this.saveGroupMemberList(groupId)
      }
    },

    /** 群主转让：群表 ownerUserId 改为新值；旧群主 role → NORMAL；新群主 role → OWNER */
    transferGroupOwner(groupId: number, oldOwnerId: number, newOwnerId: number) {
      const group = this.getGroup(groupId)
      if (!group) {
        return
      }
      if (group.ownerUserId !== newOwnerId) {
        group.ownerUserId = newOwnerId
      }
      this.updateGroupMemberRoleList(groupId, [oldOwnerId], ImGroupMemberRole.NORMAL)
      this.updateGroupMemberRoleList(groupId, [newOwnerId], ImGroupMemberRole.OWNER)
      this.saveGroup(group)
    },

    /** 本地剔除群成员（GROUP_MEMBER_QUIT / KICK 事件）；不命中则等 fetchGroupMemberList 兜底 */
    removeLocalGroupMemberList(groupId: number, userIds: number[]) {
      const group = this.getGroup(groupId)
      if (!group?.members?.length || !userIds.length) {
        return
      }
      const idSet = new Set(userIds)
      const next = group.members.filter((member) => !idSet.has(member.userId))
      if (next.length === group.members.length) {
        return
      }
      group.members = next
      group.memberCount = next.length
      this.saveGroupMemberList(groupId)
    },

    /** 本地更新群成员的 status（自己退群 / 被踢的本地预置；让 isMember 立即收敛到 stranger，不依赖 removeGroup 的整群移除） */
    updateGroupMemberStatus(groupId: number, userId: number, status: number) {
      const group = this.getGroup(groupId)
      const member = group?.members?.find((m) => m.userId === userId)
      if (!member || member.status === status) {
        return
      }
      member.status = status
      this.saveGroupMemberList(groupId)
    },

    /** 本地更新群成员的 displayUserName（GROUP_MEMBER_NICKNAME_UPDATE 事件）；不命中则等 fetchGroupMemberList 兜底 */
    updateGroupMemberDisplayUserName(groupId: number, userId: number, displayUserName: string) {
      const group = this.getGroup(groupId)
      const member = group?.members?.find((m) => m.userId === userId)
      if (!member || member.displayUserName === displayUserName) {
        return
      }
      member.displayUserName = displayUserName
      this.saveGroupMemberList(groupId)
    },

    /** 局部更新群字段（name / notice / avatar 等）；未命中本地缓存时静默忽略，等 fetchGroupList 兜底；新值跟旧值都相同时跳过响应式 + IDB 写 */
    updateGroupFields(groupId: number, fields: Partial<Group>) {
      const group = this.getGroup(groupId)
      if (!group) {
        return
      }
      const changed = (Object.keys(fields) as (keyof Group)[]).some((k) => group[k] !== fields[k])
      if (!changed) {
        return
      }
      Object.assign(group, fields)
      const conversationStore = useConversationStore()
      conversationStore.updateConversation(ImConversationType.GROUP, groupId, {
        name: getGroupDisplayName(group),
        avatar: group.avatar,
        silent: group.silent
      })
      this.saveGroup(group)
    },

    /**
     * 接收 GROUP_* 群广播事件，按 type 分发到对应私有 action
     *
     * WebSocket 实时收走 messageStore.insertMessage 旁路调用
     * store 里没缓存的群静默忽略，等 fetchGroupList 兜底
     */
    applyGroupNotification(groupId: number, type: number, content?: string) {
      if (!groupId) {
        return
      }
      let payload: GroupNotificationPayload
      try {
        payload = content ? JSON.parse(content) : {}
      } catch (error) {
        console.warn(
          '[IM groupStore] applyGroupNotification 解析 content 失败',
          { groupId, type, contentLength: content?.length ?? 0 },
          error
        )
        return
      }
      switch (type) {
        case ImContentType.GROUP_CREATE:
          this.applyGroupCreateNotification(groupId, payload)
          break
        case ImContentType.GROUP_NAME_UPDATE:
          this.applyGroupNameUpdateNotification(groupId, payload)
          break
        case ImContentType.GROUP_NOTICE_UPDATE:
          this.applyGroupNoticeUpdateNotification(groupId, payload)
          break
        case ImContentType.GROUP_INFO_UPDATE:
          this.applyGroupInfoUpdateNotification(groupId, payload)
          break
        case ImContentType.GROUP_DISSOLVE:
          this.removeGroup(groupId)
          break
        case ImContentType.GROUP_MEMBER_INVITE:
          this.applyGroupMemberInviteNotification(groupId, payload)
          break
        case ImContentType.GROUP_MEMBER_ENTER:
          this.applyGroupMemberEnterNotification(groupId, payload)
          break
        case ImContentType.GROUP_MEMBER_QUIT:
          this.applyGroupMemberQuitNotification(groupId, payload)
          break
        case ImContentType.GROUP_MEMBER_KICK:
          this.applyGroupMemberKickNotification(groupId, payload)
          break
        case ImContentType.GROUP_MEMBER_NICKNAME_UPDATE:
          this.applyGroupMemberNicknameUpdateNotification(groupId, payload)
          break
        case ImContentType.GROUP_ADMIN_ADD:
          this.updateGroupMemberRoleList(
            groupId,
            payload.memberUserIds || [],
            ImGroupMemberRole.ADMIN
          )
          this.markGroupMembersExpired(groupId)
          // 自己被加为管理员，原本看不到的群下未处理申请现在变可见，重新拉一次 unhandledList
          if (isSelfInPayloadMembers(payload)) {
            refreshUnhandledGroupRequests()
          }
          break
        case ImContentType.GROUP_ADMIN_REMOVE:
          this.updateGroupMemberRoleList(
            groupId,
            payload.memberUserIds || [],
            ImGroupMemberRole.NORMAL
          )
          this.markGroupMembersExpired(groupId)
          if (isSelfInPayloadMembers(payload)) {
            refreshUnhandledGroupRequests()
          }
          break
        case ImContentType.GROUP_OWNER_TRANSFER:
          this.applyGroupOwnerTransferNotification(groupId, payload)
          break
        case ImContentType.GROUP_MESSAGE_PIN:
          this.applyGroupMessagePinNotification(groupId, payload)
          break
        case ImContentType.GROUP_MESSAGE_UNPIN:
          this.applyGroupMessageUnpinNotification(groupId, payload)
          break
        case ImContentType.GROUP_MEMBER_MUTED:
          this.applyGroupMemberMutedNotification(groupId, payload)
          break
        case ImContentType.GROUP_MEMBER_CANCEL_MUTED:
          this.applyGroupMemberCancelMutedNotification(groupId, payload)
          break
        case ImContentType.GROUP_MUTED:
          this.updateGroupFields(groupId, { mutedAll: true })
          break
        case ImContentType.GROUP_CANCEL_MUTED:
          this.updateGroupFields(groupId, { mutedAll: false })
          break
        case ImContentType.GROUP_BANNED:
          this.updateGroupFields(groupId, { banned: !!payload.banned })
          break
      }
    },

    /** 创建群广播：群未就位时拉群详情 */
    async applyGroupCreateNotification(groupId: number, payload: GroupNotificationPayload) {
      if (!isSelfInPayloadMembers(payload)) {
        return
      }
      const selfUserId = getCurrentUserId()
      const selfIsOperator = !!selfUserId && payload.operatorUserId === selfUserId
      if (selfIsOperator && this.getGroup(groupId)) {
        return
      }
      await this.fetchGroupInfo(groupId, true)
    },

    /** 群名变更：按 newName 局部更新本地群名 */
    applyGroupNameUpdateNotification(groupId: number, payload: GroupNotificationPayload) {
      if (payload.newName) {
        this.updateGroupFields(groupId, { name: payload.newName })
      }
    },

    /** 群公告变更：按 newNotice 局部更新（允许空串作为「清空公告」） */
    applyGroupNoticeUpdateNotification(groupId: number, payload: GroupNotificationPayload) {
      this.updateGroupFields(groupId, { notice: payload.newNotice ?? '' })
    },

    /** 群信息变更：同步头像、进群审批 */
    applyGroupInfoUpdateNotification(groupId: number, payload: GroupNotificationPayload) {
      const fields: Partial<Group> = {}
      if (payload.newAvatar) {
        fields.avatar = payload.newAvatar
      }
      if (payload.newJoinApproval != null) {
        fields.joinApproval = payload.newJoinApproval
      }
      if (Object.keys(fields).length > 0) {
        this.updateGroupFields(groupId, fields)
      }
    },

    /** 成员加入：被邀请者本端 group 未就位先 fetchGroupInfo 初次拉取；所有人都刷成员列表（新成员 nickname / avatar 不在 payload） */
    async applyGroupMemberInviteNotification(groupId: number, payload: GroupNotificationPayload) {
      // 自己刚被拉进来：必须 await fetchGroupInfo 让群入 state.groups，否则 fetchGroupMemberList 的 guard 会兜空
      if (isSelfInPayloadMembers(payload) && !this.getGroup(groupId)) {
        await this.fetchGroupInfo(groupId, true)
      }
      this.markGroupMembersExpired(groupId)
      this.fetchGroupMemberList(groupId, true).catch(() => undefined)
    },

    /** 自由进群：进群者本端 group 未就位先 fetchGroupInfo 初次拉取；所有人都刷成员列表 */
    async applyGroupMemberEnterNotification(groupId: number, payload: GroupNotificationPayload) {
      const selfUserId = getCurrentUserId()
      // 自己自由进群：必须 await fetchGroupInfo 让群入 state.groups，否则 fetchGroupMemberList 的 guard 会兜空
      if (selfUserId && payload.entrantUserId === selfUserId && !this.getGroup(groupId)) {
        await this.fetchGroupInfo(groupId, true)
      }
      this.markGroupMembersExpired(groupId)
      this.fetchGroupMemberList(groupId, true).catch(() => undefined)
    },

    /** 成员退群：退群者本人先把 self.status 置 DISABLE 再 removeGroup（保留状态语义 + 维持 groups 列表干净）；其他成员从本地列表移除 quitter */
    applyGroupMemberQuitNotification(groupId: number, payload: GroupNotificationPayload) {
      const selfUserId = getCurrentUserId()
      if (selfUserId && payload.operatorUserId === selfUserId) {
        this.updateGroupMemberStatus(groupId, selfUserId, CommonStatusEnum.DISABLE)
        this.removeGroup(groupId)
      } else if (payload.operatorUserId) {
        this.removeLocalGroupMemberList(groupId, [payload.operatorUserId])
        this.markGroupMembersExpired(groupId)
      }
    },

    /** 成员被移出：被踢者本人先把 self.status 置 DISABLE 再 removeGroup；其他成员从本地列表移除被踢者 */
    applyGroupMemberKickNotification(groupId: number, payload: GroupNotificationPayload) {
      const memberIds = payload.memberUserIds || []
      const selfUserId = getCurrentUserId()
      if (isSelfInPayloadMembers(payload)) {
        if (selfUserId) {
          this.updateGroupMemberStatus(groupId, selfUserId, CommonStatusEnum.DISABLE)
        }
        this.removeGroup(groupId)
      } else if (memberIds.length) {
        this.removeLocalGroupMemberList(groupId, memberIds)
        this.markGroupMembersExpired(groupId)
      }
    },

    /** 成员昵称变更：按 operatorUserId 局部更新对应 member.displayUserName */
    applyGroupMemberNicknameUpdateNotification(groupId: number, payload: GroupNotificationPayload) {
      if (payload.operatorUserId) {
        this.updateGroupMemberDisplayUserName(
          groupId,
          payload.operatorUserId,
          payload.displayUserName ?? ''
        )
        this.markGroupMembersExpired(groupId)
      }
    },

    /** 群主转让：旧群主 → NORMAL，新群主 → OWNER；新群主自己侧重新拉申请列表 */
    applyGroupOwnerTransferNotification(groupId: number, payload: GroupNotificationPayload) {
      if (payload.operatorUserId && payload.newOwnerUserId) {
        this.transferGroupOwner(groupId, payload.operatorUserId, payload.newOwnerUserId)
        this.markGroupMembersExpired(groupId)
      }
      // 自己接管群主：原本看不到的群下未处理申请现在变可见，重新拉一次 unhandledList
      const selfUserId = getCurrentUserId()
      if (selfUserId && payload.newOwnerUserId === selfUserId) {
        refreshUnhandledGroupRequests()
      } else if (selfUserId && payload.operatorUserId === selfUserId) {
        refreshUnhandledGroupRequests()
      }
    },

    /** 群消息置顶：从 payload 取消息展示数据加入置顶列表 */
    applyGroupMessagePinNotification(groupId: number, payload: GroupNotificationPayload) {
      const message = payload.message
      if (!message) {
        return
      }
      const group = this.getGroup(groupId)
      if (!group) {
        return
      }
      // 幂等：已存在同 messageId 不重复 push
      const existing = group.pinnedMessages || []
      if (existing.some((msg) => msg.id === message.id)) {
        return
      }
      group.pinnedMessages = [
        ...existing,
        {
          id: message.id,
          clientMessageId: '',
          senderId: message.senderId,
          type: message.type,
          content: message.content,
          status: ImMessageStatus.NORMAL,
          sendTime: new Date(message.sendTime).getTime(),
          targetId: message.groupId || groupId,
          selfSend: message.senderId === getCurrentUserId(),
          atUserIds: message.atUserIds ? [...message.atUserIds] : [],
          receiverUserIds: message.receiverUserIds ? [...message.receiverUserIds] : []
        }
      ]
      this.saveGroup(group)
    },

    /** 群消息取消置顶：按 messageId 从本地置顶列表中移除 */
    applyGroupMessageUnpinNotification(groupId: number, payload: GroupNotificationPayload) {
      if (!payload.messageId) {
        return
      }
      const group = this.getGroup(groupId)
      if (!group?.pinnedMessages?.length) {
        return
      }
      const newPinnedMessages = group.pinnedMessages.filter((m) => m.id !== payload.messageId)
      if (newPinnedMessages.length === group.pinnedMessages.length) {
        return
      }
      group.pinnedMessages = newPinnedMessages
      this.saveGroup(group)
    },

    /** 单成员禁言：更新目标成员的 muteEndTime */
    applyGroupMemberMutedNotification(groupId: number, payload: GroupNotificationPayload) {
      const group = this.getGroup(groupId)
      const member = group?.members?.find((m) => m.userId === payload.mutedUserId)
      if (member && payload.muteEndTime) {
        member.muteEndTime = payload.muteEndTime
        this.saveGroupMemberList(groupId)
        this.markGroupMembersExpired(groupId)
      }
    },

    /** 单成员取消禁言：清空目标成员的 muteEndTime */
    applyGroupMemberCancelMutedNotification(groupId: number, payload: GroupNotificationPayload) {
      const group = this.getGroup(groupId)
      const member = group?.members?.find((m) => m.userId === payload.mutedUserId)
      if (member) {
        member.muteEndTime = undefined
        this.saveGroupMemberList(groupId)
        this.markGroupMembersExpired(groupId)
      }
    },

    /** 切账号时仅清 in-memory，IDB 按 userId 分桶天然隔离，回切秒开 */
    clear() {
      this.groups = []
      this.loaded = false
      this.groupMembersExpired = false
      // 账号切换：递增 epoch 废弃旧账号 in-flight 的成员请求
      storeEpoch++
      // 单飞表跟 in-memory state 一起重置；旧账号 in-flight 的请求 finally 也会自己 delete key，提前清空只是更干脆
      pendingMemberFetches.clear()
      pendingSingleMemberFetches.clear()
    }
  }
})

function convertGroup(group: ImGroupRespVO): Group {
  return {
    id: group.id,
    name: group.name,
    avatar: group.avatar,
    notice: group.notice,
    ownerUserId: group.ownerUserId,
    pinnedMessages: group.pinnedMessages?.map((message) => convertGroupMessageVO(message)),
    mutedAll: group.mutedAll,
    banned: group.banned,
    joinApproval: group.joinApproval,
    joinStatus: group.joinStatus,
    groupRemark: group.groupRemark,
    silent: group.silent
  }
}

/** 后端 ImGroupMessageRespVO -> 前端 Message：补 targetId / selfSend / sendTime 等派生字段 */
function convertGroupMessageVO(
  message: NonNullable<ImGroupRespVO['pinnedMessages']>[number]
): Message {
  const currentUserId = getCurrentUserId()
  return {
    id: message.id,
    clientMessageId: message.clientMessageId || '',
    type: message.type,
    content: message.content,
    status: message.status,
    sendTime: new Date(message.sendTime).getTime(),
    senderId: message.senderId,
    targetId: message.groupId,
    selfSend: !!currentUserId && message.senderId === currentUserId,
    atUserIds: message.atUserIds || [],
    receiverUserIds: message.receiverUserIds || [],
    receiptStatus: message.receiptStatus,
    readCount: message.readCount
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
    role: member.role,
    muteEndTime: member.muteEndTime
  }
}

export const useGroupStoreWithOut = () => useGroupStore(store)

// dev: 让 Pinia 的 actions 改动支持 HMR，免去每次改 store 都要硬刷
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGroupStore, import.meta.hot))
}
