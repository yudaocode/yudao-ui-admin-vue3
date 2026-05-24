import request from '@/config/axios'

export interface ImManagerSensitiveWordVO {
  id: number
  word: string
  status: number
  creator?: string
  creatorName?: string
  createTime?: Date
}

// 获得敏感词分页
export const getManagerSensitiveWordPage = (params: PageParam) => {
  return request.get({ url: '/im/manager/sensitive-word/page', params })
}

// 获得敏感词详情
export const getManagerSensitiveWord = (id: number) => {
  return request.get({ url: '/im/manager/sensitive-word/get', params: { id } })
}

// 新增敏感词
export const createManagerSensitiveWord = (data: ImManagerSensitiveWordVO) => {
  return request.post({ url: '/im/manager/sensitive-word/create', data })
}

// 修改敏感词
export const updateManagerSensitiveWord = (data: ImManagerSensitiveWordVO) => {
  return request.put({ url: '/im/manager/sensitive-word/update', data })
}

// 删除敏感词
export const deleteManagerSensitiveWord = (id: number) => {
  return request.delete({ url: '/im/manager/sensitive-word/delete', params: { id } })
}

// 批量删除敏感词
export const deleteManagerSensitiveWordList = (ids: number[]) => {
  return request.delete({
    url: '/im/manager/sensitive-word/delete-list',
    params: { ids: ids.join(',') }
  })
}
