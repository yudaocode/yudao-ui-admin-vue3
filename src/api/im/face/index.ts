import request from '@/config/axios'

// TODO @AI：分拆下文件！
/** 用户端表情包项（精简版） */
export interface ImFacePackUserItemVO {
  id: number
  url: string
  name?: string
  width: number
  height: number
}

/** 用户端表情包 + 嵌套 items */
export interface ImFacePackUserVO {
  id: number
  name: string
  iconUrl?: string
  items: ImFacePackUserItemVO[]
}

/** 个人表情 */
export interface ImFaceUserItemVO {
  id: number
  url: string
  name?: string
  width: number
  height: number
}

/** 添加个人表情请求 */
export interface ImFaceUserItemSaveReqVO {
  url: string
  name?: string
  width: number
  height: number
  /** 来源消息编号（从消息「添加到表情」时传，自己上传不传） */
  sourceMessageId?: number
}

// ==================== 系统表情包 ====================

/** 拉取所有启用的系统表情包（含表情列表） */
export const getFacePackList = () => {
  return request.get<ImFacePackUserVO[]>({ url: '/im/face-pack/list' })
}

// ==================== 个人表情 ====================

/** 获取我的个人表情列表 */
export const getMyFaceUserItemList = () => {
  return request.get<ImFaceUserItemVO[]>({ url: '/im/face-user-item/list' })
}

/** 添加个人表情；服务端对同 URL 幂等（直接返回旧 id） */
export const createFaceUserItem = (data: ImFaceUserItemSaveReqVO) => {
  return request.post<number>({ url: '/im/face-user-item/create', data })
}

/** 删除个人表情 */
export const deleteFaceUserItem = (id: number) => {
  return request.delete({ url: '/im/face-user-item/delete?id=' + id })
}

/** 批量删除个人表情 */
export const deleteFaceUserItemList = (ids: number[]) => {
  return request.delete({
    url: '/im/face-user-item/delete-list',
    params: { ids: ids.join(',') }
  })
}
