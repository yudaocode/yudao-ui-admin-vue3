import { defineStore } from 'pinia'
import { store } from '@/store'

import {
  getMyGroupList as apiGetMyGroupList,
  getGroup as apiGetGroup,
  type ImGroupRespVO
} from '@/api/im/group'
import {
  getGroupMemberList as apiGetGroupMemberList,
  type ImGroupMemberRespVO
} from '@/api/im/group/member'
import { useConversationStore } from './conversationStore'
import { ImConversationType } from '../../utils/constants'
import type { Group, GroupMember } from '../types'

/**
 * IM 群 Store
 *
 * 负责：
 * - 拉取 / 缓存当前登录用户加入的群列表
 * - 按 groupId 懒加载群成员（供 ChatGroupSide / MentionPicker / MessageReadStatus 消费）
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
      this.groups = (list || []).map(convertGroup)
      this.loaded = true
      const conversationStore = useConversationStore()
      for (const g of this.groups) {
        conversationStore.updateConversation(ImConversationType.GROUP, g.id, {
          name: g.name,
          avatar: g.avatar,
          muted: g.muted
        })
      }
    },

    /** 刷新单个群详情 */
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

    /** 按群拉取成员（带缓存，force=true 强制刷新） */
    async loadGroupMembers(groupId: number, force = false): Promise<GroupMember[]> {
      // 命中缓存：群已加载且成员列表已就绪，直接返回（force=true 时强制刷）
      const group = this.getGroup(groupId)
      if (group && group.members && !force) {
        return group.members
      }

      // 拉取该群所有成员（聚合自 AdminUser，含 nickname / avatar / displayUserName）
      const list = await apiGetGroupMemberList(groupId)
      const members = (list || []).map((member) => convertGroupMember(member, groupId))
      // 成员列表可能在群列表之前触发，此时需要占位一个 group
      if (!group) {
        this.upsertGroup({
          id: groupId,
          name: String(groupId),
          members,
          memberCount: members.length
        })
      } else {
        group.members = members
        group.memberCount = members.length
      }
      return members
    },

    upsertGroup(group: Group) {
      // 按 id 查已有记录下标：>=0 命中则覆盖合并，<0 则追加
      const index = this.groups.findIndex((g) => g.id === group.id)
      if (index >= 0) {
        this.groups[index] = { ...this.groups[index], ...group }
      } else {
        this.groups.push(group)
      }
      // 同步对应群聊会话的展示
      const conversationStore = useConversationStore()
      conversationStore.updateConversation(ImConversationType.GROUP, group.id, {
        name: group.name,
        avatar: group.avatar,
        muted: group.muted
      })
    },

    /** 本地移除（WebSocket GROUP_DEL 事件触发；同时级联清群聊会话） */
    removeGroup(id: number) {
      // 直接从本地列表里移除（群解散是硬删，不留墓碑，区别于好友的软删）
      this.groups = this.groups.filter((g) => g.id !== id)
      // 级联清理：对应群聊会话也软删，避免会话列表里留着已解散的群
      const conversationStore = useConversationStore()
      conversationStore.removeGroupConversation(id)
    },

    /** 切换免打扰（仅本地状态；后端 /im/group/update 接入 muted 字段后再补） */
    setMuted(id: number, muted: boolean) {
      // 在本地 group 上直接打 muted 标记；conversationStore 的会话级 muted 由 ConversationItem 单独 setMuted 写
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
    status: member.status
  }
}

export const useGroupStoreWithOut = () => useGroupStore(store)
