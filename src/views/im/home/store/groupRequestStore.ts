import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import {
  agreeGroupRequest as apiAgreeGroupRequest,
  getMyGroupRequest as apiGetMyGroupRequest,
  getUnhandledRequestList as apiGetUnhandledRequestList,
  refuseGroupRequest as apiRefuseGroupRequest,
  type ImGroupRequestRespVO
} from '@/api/im/group/request'
import { ImGroupRequestHandleResult } from '@/views/im/utils/constants'
import { getDb } from '../../utils/db'
import type { GroupRequestDO } from '../types'

/**
 * IM 加群申请 Store
 *
 * 仅维护「我管理的所有群」下未处理的申请列表（unhandledList）；
 * 横幅 / Drawer 都从这里派生 count 和分组列表，避免给 ImGroupRespVO 挂 pendingRequestCount 字段
 *
 * 数据生命周期：
 * - 进 IM 后调一次 fetchUnhandledGroupRequestList 拉首页全量
 * - WebSocket 1503 → 调 addGroupRequestById(requestId) 拉单条 + push 到 unhandledList 头部
 * - WebSocket 1505 / 1506 → 按 requestId 从 unhandledList 移除
 * - WebSocket 1517 GROUP_ADMIN_ADD（自己被加为 admin）→ 重新调 fetchUnhandledGroupRequestList
 * - 本端 agree / refuse 处理后 → 本地按 requestId 移除
 */
export const useGroupRequestStore = defineStore('imGroupRequestStore', {
  state: () => ({
    /** 我管理的所有群下未处理申请列表（按 id 倒序） */
    unhandledList: [] as ImGroupRequestRespVO[],
    /** fetchUnhandledGroupRequestList 是否成功执行过；避免横幅显示 0 然后跳数字的闪烁 */
    loaded: false
  }),

  getters: {
    /**
     * 各群下未处理申请数的 Map；O(N) 扫一次缓存供 ConversationItem 等 N 处复用，避免 N×M 重复 filter
     */
    getUnhandledGroupRequestCountMap(state): Map<number, number> {
      const map = new Map<number, number>()
      for (const request of state.unhandledList) {
        map.set(request.groupId, (map.get(request.groupId) ?? 0) + 1)
      }
      return map
    },
    /** 指定群下的未处理申请数 */
    getUnhandledGroupRequestCount(): (groupId: number) => number {
      return (groupId: number) => this.getUnhandledGroupRequestCountMap.get(groupId) ?? 0
    },
    /** 指定群下的未处理申请列表 */
    getUnhandledGroupRequestListByGroupId:
      (state) =>
      (groupId: number): ImGroupRequestRespVO[] =>
        state.unhandledList.filter((r) => r.groupId === groupId)
  },

  actions: {
    /** 从 IndexedDB 恢复加群申请 */
    async loadGroupRequestList(): Promise<boolean> {
      try {
        const cached = await getDb().getAll<GroupRequestDO>('groupRequests')
        if (!cached || cached.length === 0) {
          return false
        }
        this.unhandledList = cached
          .filter((request) => request.handleResult === ImGroupRequestHandleResult.UNHANDLED)
          .sort((requestA, requestB) => requestB.id - requestA.id)
        return true
      } catch (e) {
        console.warn('[IM groupRequestStore] 本地加群申请缓存读取失败', e)
        return false
      }
    },

    /** 保存加群申请列表 */
    saveGroupRequestList(): void {
      void getDb()
        .transaction(['groupRequests'], 'readwrite', async (tx) => {
          const db = getDb()
          await db.clearStore('groupRequests', tx)
          for (const request of this.unhandledList) {
            await db.put('groupRequests', request, tx)
          }
        })
        .catch((e) => console.warn('[IM groupRequestStore] 本地加群申请缓存写入失败', e))
    },

    /** 保存单条加群申请 */
    saveGroupRequest(request: ImGroupRequestRespVO): void {
      void getDb()
        .put('groupRequests', request)
        .catch((e) => console.warn('[IM groupRequestStore] 本地加群申请写入失败', e))
    },

    /** 拉取我管理的所有群下未处理申请；进 IM 后 / 升级 admin 后 / WS 推送有冲突时调用 */
    async fetchUnhandledGroupRequestList() {
      const list = await apiGetUnhandledRequestList()
      this.unhandledList = list || []
      this.loaded = true
      this.saveGroupRequestList()
    },

    /**
     * WS 收到 1503：拉最新内容并置顶
     *
     * 同一对 group_id, user_id 复用记录时 requestId 不变但 applyContent / inviterUserId 会刷新，所以无条件 fetch + 排到头部
     * 校验 handleResult：HTTP 在途时若已收到 1505 / 1506，returnedRequest 可能已是已处理状态，不能再塞回未处理列表
     */
    async addGroupRequestById(requestId: number) {
      const request = await apiGetMyGroupRequest(requestId)
      if (!request || request.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
        return
      }
      this.unhandledList = [request, ...this.unhandledList.filter((r) => r.id !== requestId)]
      this.saveGroupRequest(request)
    },

    /** WS 收到 1505 / 1506 或本端处理完一条：按 requestId 从列表移除 */
    removeGroupRequestById(requestId: number) {
      this.unhandledList = this.unhandledList.filter((r) => r.id !== requestId)
      void getDb()
        .delete('groupRequests', requestId)
        .catch((e) => console.warn('[IM groupRequestStore] 本地加群申请删除失败', e))
    },

    /** 同意申请；本端处理后立即从列表移除，避免被反复点击 */
    async agreeGroupRequest(requestId: number) {
      await apiAgreeGroupRequest(requestId)
      this.removeGroupRequestById(requestId)
    },

    /** 拒绝申请 */
    async refuseGroupRequest(requestId: number, handleContent?: string) {
      await apiRefuseGroupRequest(requestId, handleContent)
      this.removeGroupRequestById(requestId)
    },

    /** 清空加群申请内存 */
    clear() {
      this.unhandledList = []
      this.loaded = false
    }
  }
})

export const useGroupRequestStoreWithOut = () => useGroupRequestStore(store)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGroupRequestStore, import.meta.hot))
}
