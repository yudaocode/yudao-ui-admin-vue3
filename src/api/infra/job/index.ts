import request from '@/config/axios'

export interface JobVO {
  id: number
  name: string
  status: number
  handlerName: string
  handlerParam: string
  cronExpression: string
  retryCount: number
  retryInterval: number
  monitorTimeout: number
  createTime: Date
}

// 任务列表
export const getJobPage = (params: PageParam) => {
  return request.get({ url: '/infra/job/page', params })
}

// 任务详情
export const getJob = (id: number) => {
  return request.get({ url: '/infra/job/get?id=' + id })
}

// 新增任务
export const createJob = (data: JobVO) => {
  return request.post({ url: '/infra/job/create', data })
}

// 修改定时任务调度
export const updateJob = (data: JobVO) => {
  return request.put({ url: '/infra/job/update', data })
}

// 删除定时任务调度
export const deleteJob = (id: number) => {
  return request.delete({ url: '/infra/job/delete?id=' + id })
}

// 批量删除定时任务调度
export const deleteJobList = (ids: number[]) => {
  return request.delete({ url: '/infra/job/delete-list', params: { ids: ids.join(',') } })
}

// 导出定时任务调度
export const exportJob = (params) => {
  return request.download({ url: '/infra/job/export-excel', params })
}

// 任务状态修改
export const updateJobStatus = (id: number, status: number) => {
  const params = {
    id,
    status
  }
  return request.put({ url: '/infra/job/update-status', params })
}

// 定时任务立即执行一次
export const runJob = (id: number) => {
  return request.put({ url: '/infra/job/trigger?id=' + id })
}

// 获得定时任务的下 n 次执行时间
export const getJobNextTimes = (id: number) => {
  return request.get({ url: '/infra/job/get_next_times?id=' + id })
}
