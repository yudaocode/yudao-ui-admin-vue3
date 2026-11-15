import request from '@/config/axios'

// AI 短剧生成任务 VO
export interface DramaTaskVO {
  type: number // 任务类型，参见 ai_drama_task_type 字典
  id: number
  projectId: number
  projectName?: string
  userId?: number
  userNickname?: string
  title?: string
  status: number
  errorMessage?: string
  prompt?: string
  modelId?: number
  taskId?: string
  resultUrl?: string
  timeout?: boolean // 是否已超时
  createTime?: Date
  updateTime?: Date
}

// AI 短剧生成任务 API（管理）
export const DramaTaskApi = {
  getTaskPage: async (params: any) => {
    return await request.get({ url: `/ai/drama/task/page`, params })
  },
  resubmitTask: async (type: number, id: number) => {
    return await request.put({ url: `/ai/drama/task/resubmit`, data: { type, id } })
  },
  syncTask: async (type: number, id: number) => {
    return await request.put({ url: `/ai/drama/task/sync`, data: { type, id } })
  },
  updateTaskFail: async (type: number, id: number) => {
    return await request.put({ url: `/ai/drama/task/update-fail`, data: { type, id } })
  }
}
