import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import {
  agreeGroupRequest as apiAgreeGroupRequest,
  getMyGroupRequest as apiGetMyGroupRequest,
  getUnhandledRequestList as apiGetUnhandledRequestList,
  refuseGroupRequest as apiRefuseGroupRequest,
  type ImGroupRequestRespVO
} from '@/api/im/home/group/request'
import { ImGroupRequestHandleResult } from '@/views/im/utils/constants'

/**
 * IM 加群申请 Store
 *
 * 仅维护「我管理的所有群」下未处理的申请列表（unhandledList）；
 * 横幅 / Drawer 都从这里派生 count 和分组列表，避免给 ImGroupRespVO 挂 pendingRequestCount 字段
 *
 * 数据生命周期：
 * - 进 IM 后调一次 fetchUnhandledList 拉首页全量
 * - WebSocket 1503 → 调 fetchOne(requestId) 拉单条 + push 到 unhandledList 头部
 * - WebSocket 1505 / 1506 → 按 requestId 从 unhandledList 移除
 * - WebSocket 1517 GROUP_ADMIN_ADD（自己被加为 admin）→ 重新调 fetchUnhandledList
 * - 本端 agree / refuse 处理后 → 本地按 requestId 移除
 */
export const useGroupRequestStore = defineStore('imGroupRequestStore', {
  state: () => ({
    /** 我管理的所有群下未处理申请列表（按 id 倒序） */
    unhandledList: [] as ImGroupRequestRespVO[],
    /** fetchUnhandledList 是否成功执行过；避免横幅显示 0 然后跳数字的闪烁 */
    loaded: false
  }),

  getters: {
    /**
     * 各群下未处理申请数的 Map；O(N) 扫一次缓存供 ConversationItem 等 N 处复用，避免 N×M 重复 filter
     */
    unhandledCountMap(state): Map<number, number> {
      const map = new Map<number, number>()
      for (const request of state.unhandledList) {
        map.set(request.groupId, (map.get(request.groupId) ?? 0) + 1)
      }
      return map
    },
    /** 指定群下的未处理申请数 */
    getUnhandledCountByGroupId(): (groupId: number) => number {
      return (groupId: number) => this.unhandledCountMap.get(groupId) ?? 0
    },
    /** 指定群下的未处理申请列表 */
    getUnhandledListByGroupId:
      (state) =>
      (groupId: number): ImGroupRequestRespVO[] =>
        state.unhandledList.filter((r) => r.groupId === groupId)
  },

  actions: {
    /** 拉取我管理的所有群下未处理申请；进 IM 后 / 升级 admin 后 / WS 推送有冲突时调用 */
    async fetchUnhandledList() {
      const list = await apiGetUnhandledRequestList()
      this.unhandledList = list || []
      this.loaded = true
    },

    /**
     * WS 收到 1503：拉最新内容并置顶
     *
     * 同一对 group_id, user_id 复用记录时 requestId 不变但 applyContent / inviterUserId 会刷新，所以无条件 fetch + 排到头部
     * 校验 handleResult：HTTP 在途时若已收到 1505 / 1506，returnedRequest 可能已是已处理状态，不能再塞回未处理列表
     */
    async addByRequestId(requestId: number) {
      const request = await apiGetMyGroupRequest(requestId)
      if (!request || request.handleResult !== ImGroupRequestHandleResult.UNHANDLED) {
        return
      }
      this.unhandledList = [request, ...this.unhandledList.filter((r) => r.id !== requestId)]
    },

    /** WS 收到 1505 / 1506 或本端处理完一条：按 requestId 从列表移除 */
    removeByRequestId(requestId: number) {
      this.unhandledList = this.unhandledList.filter((r) => r.id !== requestId)
    },

    /** 同意申请；本端处理后立即从列表移除，避免被反复点击 */
    async agreeRequest(requestId: number) {
      await apiAgreeGroupRequest(requestId)
      this.removeByRequestId(requestId)
    },

    /** 拒绝申请 */
    async refuseRequest(requestId: number, handleContent?: string) {
      await apiRefuseGroupRequest(requestId, handleContent)
      this.removeByRequestId(requestId)
    },

    /** 退出 IM / 切账号时清理 */
    reset() {
      this.unhandledList = []
      this.loaded = false
    }
  }
})

export const useGroupRequestStoreWithOut = () => useGroupRequestStore(store)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGroupRequestStore, import.meta.hot))
}
