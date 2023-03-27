import request from '@/config/axios'
import qs from 'qs'

export interface SensitiveWordVO {
  id: number
  name: string
  status: number
  description: string
  tags: string[]
  createTime: Date
}

export interface SensitiveWordTestReqVO {
  text: string
  tag: string[]
}

// 查询敏感词列表
export const getSensitiveWordPage = (params: PageParam) => {
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
export const exportSensitiveWord = (params) => {
  return request.download({ url: '/system/sensitive-word/export-excel', params })
}

// 获取所有敏感词的标签数组
export const getSensitiveWordTagList = () => {
  return request.get({ url: '/system/sensitive-word/get-tags' })
}

// 获得文本所包含的不合法的敏感词数组
export const validateText = (query: SensitiveWordTestReqVO) => {
  return request.get({
    url: '/system/sensitive-word/validate-text?' + qs.stringify(query, { arrayFormat: 'repeat' })
  })
}
