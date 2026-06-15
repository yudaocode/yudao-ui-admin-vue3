import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import {
  agreeGroupRequest as apiAgreeGroupRequest,
  getMyGroupRequest as apiGetMyGroupRequest,
  getUnhandledRequestList as apiGetUnhandledRequestList,
  pullMyGroupRequestList as apiPullMyGroupRequestList,
  refuseGroupRequest as apiRefuseGroupRequest,
  type ImGroupRequestRespVO
} from '@/api/im/group/request'
import { ImGroupRequestHandleResult } from '@/views/im/utils/constants'
import { getDb, StorageKeys } from '../../utils/db'
import { runIncrementalPull } from '../../utils/pull'
import { getCurrentUserId } from '@/utils/auth'
import type { GroupRequestDO } from '../types'

type PendingRequest = { epoch: number; userId: number; promise: Promise<void> }

/** clear() 时递增；旧账号 in-flight 的 pullGroupRequests 结果 resolve 后比对一致才写 store，防跨账号红点污染（与 friendStore 同口径） */
let storeEpoch = 0
let pendingUnhandledFetch: PendingRequest | null = null

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
    async saveGroupRequestRecord(request: ImGroupRequestRespVO): Promise<void> {
      await getDb().put('groupRequests', request)
    },

    /** 保存单条加群申请 */
    saveGroupRequest(request: ImGroupRequestRespVO): void {
      void this.saveGroupRequestRecord(request).catch((e) =>
        console.warn('[IM groupRequestStore] 本地加群申请写入失败', e)
      )
    },

    /** 拉取我管理的所有群下未处理申请；进 IM 后 / 升级 admin 后 / WS 推送有冲突时调用 */
    async fetchUnhandledGroupRequestList() {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      if (
        pendingUnhandledFetch?.epoch === requestEpoch &&
        pendingUnhandledFetch.userId === requestUserId
      ) {
        return pendingUnhandledFetch.promise
      }
      const promise = (async () => {
        const list = await apiGetUnhandledRequestList()
        if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
          return
        }
        this.unhandledList = list || []
        this.loaded = true
        this.saveGroupRequestList()
      })().finally(() => {
        if (
          pendingUnhandledFetch?.epoch === requestEpoch &&
          pendingUnhandledFetch.userId === requestUserId
        ) {
          pendingUnhandledFetch = null
        }
      })
      pendingUnhandledFetch = { epoch: requestEpoch, userId: requestUserId, promise }
      return promise
    },

    /**
     * WS 收到 1503：拉最新内容并置顶
     *
     * 同一对 group_id, user_id 复用记录时 requestId 不变但 applyContent / inviterUserId 会刷新，所以无条件 fetch + 排到头部
     */
    async addGroupRequestById(requestId: number) {
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      const request = await apiGetMyGroupRequest(requestId)
      if (!request) {
        return
      }
      if (requestEpoch !== storeEpoch || getCurrentUserId() !== requestUserId) {
        return
      }
      this.upsertGroupRequest(request)
    },

    /**
     * 本地合并 / 新增单条加群申请（WS 推送 & 增量拉取共用）
     *
     * 未处理的按 id 去重后置顶；已处理的从未处理列表移除，避免补偿时把已同意 / 拒绝的记录塞回红点
     */
    upsertGroupRequest(request: ImGroupRequestRespVO) {
      void this.upsertGroupRequestForPull(request).catch((e) =>
        console.warn('[IM groupRequestStore] 本地加群申请写入失败', e)
      )
    },

    /** 本地合并 / 新增单条加群申请 */
    async upsertGroupRequestForPull(request: ImGroupRequestRespVO): Promise<void> {
      if (request.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
        await this.removeGroupRequestByIdForPull(request.id)
        return
      }
      this.unhandledList = [request, ...this.unhandledList.filter((r) => r.id !== request.id)]
      await this.saveGroupRequestRecord(request)
    },

    /**
     * 增量拉取加群申请变更并合并；含已处理的按 handleResult 走移除（已处理 → 从红点列表剔除）
     *
     * 只做重连 / 后续离线补偿，不负责首登：首登红点走 fetchUnhandledGroupRequestList（服务端直接过滤未处理，语义更精准、启动更轻）。
     * 故首次重连时游标为空 = 一次性全量走一遍（已处理记录命中 removeGroupRequestById 为 no-op，红点不受影响），之后增量。
     */
    async pullGroupRequests() {
      // 快照 epoch；账号在拉取途中切换（clear() → epoch++）时丢弃旧账号那几页结果，防跨账号红点污染
      const requestEpoch = storeEpoch
      const requestUserId = getCurrentUserId()
      const isActive = () => requestEpoch === storeEpoch && getCurrentUserId() === requestUserId
      await runIncrementalPull(
        StorageKeys.settings.groupRequestPullCursor,
        apiPullMyGroupRequestList,
        async (records) => {
          if (!isActive()) {
            return false
          }
          await Promise.all(records.map((vo) => this.upsertGroupRequestForPull(vo)))
          return true
        },
        isActive
      )
      if (isActive()) {
        this.loaded = true
      }
    },

    /** WS 收到 1505 / 1506 或本端处理完一条：按 requestId 从列表移除 */
    removeGroupRequestById(requestId: number) {
      this.unhandledList = this.unhandledList.filter((r) => r.id !== requestId)
      void getDb()
        .delete('groupRequests', requestId)
        .catch((e) => console.warn('[IM groupRequestStore] 本地加群申请删除失败', e))
    },

    /** 删除单条加群申请 */
    async removeGroupRequestByIdForPull(requestId: number): Promise<void> {
      this.unhandledList = this.unhandledList.filter((r) => r.id !== requestId)
      await getDb().delete('groupRequests', requestId)
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
      // 账号切换：递增 epoch 废弃旧账号 in-flight 的 pullGroupRequests 结果，避免写进新账号红点列表
      storeEpoch++
      pendingUnhandledFetch = null
    }
  }
})

export const useGroupRequestStoreWithOut = () => useGroupRequestStore(store)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGroupRequestStore, import.meta.hot))
}
