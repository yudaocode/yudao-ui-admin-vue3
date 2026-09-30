import request from '@/config/axios'

export interface OaNoteVO {
  id?: number // 笔记编号
  creatorUserId?: number // 创建人用户编号
  creatorUserName?: string // 创建人用户昵称
  categoryId?: number // 目录编号
  categoryName?: string // 目录名称
  type: number // 笔记类型
  priority: number // 优先级
  title: string // 标题
  content?: string // 内容
  favorite?: boolean // 是否收藏
  fileUrls: string[] // 附件地址列表
  receiverUserIds?: number[] // 接收人用户编号列表
  receiverUserNames?: string[] // 接收人用户昵称列表
  createTime?: string // 创建时间
}

// 查询我的笔记分页
export const getMyNotePage = (params: PageParam) => {
  return request.get({ url: '/oa/note/my-page', params })
}

// 查询共享给我的笔记分页
export const getReceivedNotePage = (params: PageParam) => {
  return request.get({ url: '/oa/note/received-page', params })
}

// 查询笔记详情
export const getNote = (id: number) => {
  return request.get({ url: '/oa/note/get', params: { id } })
}

// 新增笔记
export const createNote = (data: OaNoteVO) => {
  return request.post({ url: '/oa/note/create', data })
}

// 修改笔记
export const updateNote = (data: OaNoteVO) => {
  return request.put({ url: '/oa/note/update', data })
}

// 删除笔记
export const deleteNote = (id: number) => {
  return request.delete({ url: '/oa/note/delete', params: { id } })
}

// 移除收到的共享笔记，仅删除本人的接收关系
export const deleteReceivedNote = (id: number) => {
  return request.delete({ url: '/oa/note/delete-received', params: { id } })
}

// 修改笔记收藏状态
export const updateNoteFavorite = (id: number, favorite: boolean) => {
  return request.put({ url: '/oa/note/update-favorite', data: { id, favorite } })
}

// 修改笔记共享接收人
export const updateNoteShare = (id: number, receiverUserIds: number[]) => {
  return request.put({ url: '/oa/note/update-share', data: { id, receiverUserIds } })
}
