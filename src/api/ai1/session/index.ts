import request from '@/config/axios'

/** AI1 会话信息 */
export interface Session {
  id: number // 编号
  agentId: number // Agent 编号
  userId: number // 用户编号
  userNickname?: string // 用户昵称
  title: string // 标题
  createTime: Date // 创建时间
  updateTime: Date // 更新时间
}

// AI1 会话 API
export const SessionApi = {
  // 创建【我的】会话
  createSessionMy: async (agentId: number): Promise<number> => {
    return await request.post({ url: `/ai1/session/create-my`, data: { agentId } })
  },

  // 修改【我的】会话
  updateSessionMy: async (data: { id: number; title: string }) => {
    return await request.put({ url: `/ai1/session/update-my`, data })
  },

  // 删除【我的】会话
  deleteSessionMy: async (id: number) => {
    return await request.delete({ url: `/ai1/session/delete-my?id=` + id })
  },

  // 获得【我的】会话列表
  getSessionMyList: async (agentId: number): Promise<Session[]> => {
    return await request.get({ url: `/ai1/session/my-list?agentId=` + agentId })
  },

  // 获得会话分页
  getSessionPage: async (params: any) => {
    return await request.get({ url: `/ai1/session/page`, params })
  }
}
