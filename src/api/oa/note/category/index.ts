import request from '@/config/axios'

export interface OaNoteCategoryVO {
  id?: number // 目录编号
  name: string // 目录名称
  sort: number // 显示排序
  createTime?: string // 创建时间
}

// 查询笔记目录列表
export const getNoteCategoryList = () => {
  return request.get<OaNoteCategoryVO[]>({ url: '/oa/note-category/list' })
}

// 查询笔记目录详情
export const getNoteCategory = (id: number) => {
  return request.get<OaNoteCategoryVO>({ url: '/oa/note-category/get', params: { id } })
}

// 查询分类精简列表
export const getSimpleNoteCategoryList = (): Promise<OaNoteCategoryVO[]> => {
  return request.get({ url: '/oa/note-category/simple-list' })
}

// 新增笔记目录
export const createNoteCategory = (data: OaNoteCategoryVO) => {
  return request.post({ url: '/oa/note-category/create', data })
}

// 修改笔记目录
export const updateNoteCategory = (data: OaNoteCategoryVO) => {
  return request.put({ url: '/oa/note-category/update', data })
}

// 删除笔记目录
export const deleteNoteCategory = (id: number) => {
  return request.delete({ url: '/oa/note-category/delete', params: { id } })
}
