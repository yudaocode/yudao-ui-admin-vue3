import { defineStore, acceptHMRUpdate } from 'pinia'
import { store } from '@/store'

import {
  agreeGroupRequest as apiAgreeGroupRequest,
  getMyGroupRequest as apiGetMyGroupRequest,
  getUnhandledRequestList as apiGetUnhandledRequestList,
  refuseGroupRequest as apiRefuseGroupRequest,
  type ImGroupRequestRespVO
} from '@/api/im/group/request'

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
    /** 指定群下的未处理申请数；横幅红点 */
    getUnhandledCountByGroupId:
      (state) =>
      (groupId: number): number =>
        state.unhandledList.filter((r) => r.groupId === groupId).length,
    /** 指定群下的未处理申请列表；Drawer 内容 */
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

    /** WS 收到 1503：按 requestId 单查 + push 进列表头；payload 已带申请方昵称 / 头像可减一次回查 */
    async addByRequestId(requestId: number) {
      const exists = this.unhandledList.some((r) => r.id === requestId)
      if (exists) {
        return
      }
      const request = await apiGetMyGroupRequest(requestId)
      if (!request) {
        return
      }
      this.unhandledList.unshift(request)
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
