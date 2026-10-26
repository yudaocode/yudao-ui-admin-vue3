import { compareId } from '@/utils/id'
import { defineStore, acceptHMRUpdate } from 'pinia'

import {
  agreeGroupRequest as apiAgreeGroupRequest,
  getMyGroupRequest as apiGetMyGroupRequest,
  getUnhandledRequestList as apiGetUnhandledRequestList,
  pullMyGroupRequestList as apiPullMyGroupRequestList,
  refuseGroupRequest as apiRefuseGroupRequest,
  type ImGroupRequestRespVO
} from '@/api/im/group/request'
import { ImGroupRequestHandleResult } from '@/views/im/utils/constants'
import { getDb, initDb, StorageKeys, type DbClient } from '../../utils/db'
import { runIncrementalPull } from '../../utils/pull'
import {
  ResourceRequestKey,
  ResourceRequestMode,
  runResourceRequest
} from '../../utils/resourceRequest'
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
    unhandledList: [] as ImGroupRequestRespVO[]
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
    }
  },

  actions: {
    /** 从 IndexedDB 恢复加群申请 */
    async loadGroupRequestList(): Promise<void> {
      try {
        const cached = await getDb().getAll<GroupRequestDO>('groupRequests')
        if (cached.length === 0) {
          return
        }
        this.unhandledList = cached
          .filter((request) => request.handleResult === ImGroupRequestHandleResult.UNHANDLED)
          .sort((requestA, requestB) => compareId(requestB.id, requestA.id))
      } catch (e) {
        console.warn('[IM groupRequestStore] 本地加群申请缓存读取失败', e)
      }
    },

    /** 拉取我管理的所有群下未处理申请；进 IM 后 / 升级 admin 后 / WS 推送有冲突时调用 */
    async fetchUnhandledGroupRequestList() {
      return runResourceRequest(
        ResourceRequestKey.GROUP_REQUEST_UNHANDLED,
        async () => {
          const db = await initDb()
          this.unhandledList = await apiGetUnhandledRequestList()
          const snapshot = [...this.unhandledList]
          void db
            .transaction(['groupRequests'], 'readwrite', async (tx) => {
              await db.clearStore('groupRequests', tx)
              for (const request of snapshot) {
                await db.put('groupRequests', request, tx)
              }
            })
            .catch((e) => console.warn('[IM groupRequestStore] 本地加群申请缓存写入失败', e))
        },
        { mode: ResourceRequestMode.SINGLE_FLIGHT }
      )
    },

    /**
     * WS 收到 1503：拉最新内容并置顶
     *
     * 同一对 group_id, user_id 复用记录时 requestId 不变但 applyContent / inviterUserId 会刷新，所以无条件 fetch + 排到头部
     */
    async addGroupRequestById(requestId: number) {
      const db = await initDb()
      const request = await apiGetMyGroupRequest(requestId)
      if (!request) {
        return
      }
      await this.upsertGroupRequestForPull(request, db)
    },

    /** 本地合并 / 新增单条加群申请 */
    async upsertGroupRequestForPull(
      request: ImGroupRequestRespVO,
      db: DbClient = getDb()
    ): Promise<void> {
      if (request.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
        await this.removeGroupRequestByIdForPull(request.id, db)
        return
      }
      this.unhandledList = [request, ...this.unhandledList.filter((r) => r.id !== request.id)]
      await db.put('groupRequests', request)
    },

    /**
     * 增量拉取加群申请变更并合并；含已处理的按 handleResult 走移除（已处理 → 从红点列表剔除）
     *
     * 只做重连 / 后续离线补偿，不负责首登：首登红点走 fetchUnhandledGroupRequestList（服务端直接过滤未处理，语义更精准、启动更轻）。
     * 故首次重连时游标为空 = 一次性全量走一遍（已处理记录命中 removeGroupRequestById 为 no-op，红点不受影响），之后增量。
     */
    async pullGroupRequests() {
      const db = await initDb()
      await runIncrementalPull(
        db,
        StorageKeys.settings.groupRequestPullCursor,
        (params) => apiPullMyGroupRequestList(params),
        async (records) => {
          await Promise.all(records.map((vo) => this.upsertGroupRequestForPull(vo, db)))
          return true
        }
      )
    },

    /** WS 收到 1505 / 1506 或本端处理完一条：按 requestId 从列表移除 */
    removeGroupRequestById(requestId: number, db: DbClient = getDb()) {
      this.unhandledList = this.unhandledList.filter((r) => r.id !== requestId)
      void db
        .delete('groupRequests', requestId)
        .catch((e) => console.warn('[IM groupRequestStore] 本地加群申请删除失败', e))
    },

    /** 删除单条加群申请 */
    async removeGroupRequestByIdForPull(requestId: number, db: DbClient = getDb()): Promise<void> {
      this.unhandledList = this.unhandledList.filter((r) => r.id !== requestId)
      await db.delete('groupRequests', requestId)
    },

    /** 同意申请；本端处理后立即从列表移除，避免被反复点击 */
    async agreeGroupRequest(requestId: number) {
      const db = await initDb()
      await apiAgreeGroupRequest(requestId)
      this.removeGroupRequestById(requestId, db)
    },

    /** 拒绝申请 */
    async refuseGroupRequest(requestId: number, handleContent?: string) {
      const db = await initDb()
      await apiRefuseGroupRequest(requestId, handleContent)
      this.removeGroupRequestById(requestId, db)
    },

    /** 清空加群申请内存 */
    clear() {
      this.unhandledList = []
    }
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGroupRequestStore, import.meta.hot))
}
