import request from '@/config/axios'

export interface SensitiveWordVO {
  id: number
  name: string
  status: number
  description: string
  tags: string[]
  createTime: Date
}

export interface SensitiveWordPageReqVO extends PageParam {
  name?: string
  tag?: string
  status?: number
  createTime?: Date[]
}

export interface SensitiveWordExportReqVO {
  name?: string
  tag?: string
  status?: number
  createTime?: Date[]
}

// 查询敏感词列表
export const getSensitiveWordPage = (params: SensitiveWordPageReqVO) => {
  return request.get({ url: '/system/sensitive-word/page', params })
}

// 查询敏感词详情
export const getSensitiveWord = (id: number) => {
  return request.get({ url: '/system/sensitive-word/get?id=' + id })
}

// 新增敏感词
export const createSensitiveWord = (data: SensitiveWordVO) => {
  return request.post({ url: '/system/sensitive-word/create', data })
}

// 修改敏感词
export const updateSensitiveWord = (data: SensitiveWordVO) => {
  return request.put({ url: '/system/sensitive-word/update', data })
}

// 删除敏感词
export const deleteSensitiveWord = (id: number) => {
  return request.delete({ url: '/system/sensitive-word/delete?id=' + id })
}

// 导出敏感词
export const exportSensitiveWord = (params: SensitiveWordExportReqVO) => {
  return request.download({ url: '/system/sensitive-word/export-excel', params })
}

// 获取所有敏感词的标签数组
export const getSensitiveWordTags = () => {
  return request.get({ url: '/system/sensitive-word/get-tags' })
}

// 获得文本所包含的不合法的敏感词数组
export const validateText = (id: number) => {
  return request.get({ url: '/system/sensitive-word/validate-text?' + id })
}
