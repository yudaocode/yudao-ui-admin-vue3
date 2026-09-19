import request from '@/config/axios'
import type { PmsKnowledgeInteractionItemVO } from '../types'

// 关注知识对象
export const createKnowledgeFavorite = (data: { type: number; entityId: number }) => {
  return request.post({ url: '/pms/kb/favorite/create', data })
}

// 取消关注知识对象
export const deleteKnowledgeFavorite = (type: number, entityId: number) => {
  return request.delete({ url: '/pms/kb/favorite/delete', params: { type, entityId } })
}

// 查询关注列表分页
export const getKnowledgeFavoritePage = (params: PageParam) => {
  return request.get<PageResult<PmsKnowledgeInteractionItemVO[]>>({
    url: '/pms/kb/favorite/page',
    params
  })
}

// 查询指定知识库内的关注内容
export const getKnowledgeFavoriteList = (libraryId: number) => {
  return request.get<PmsKnowledgeInteractionItemVO[]>({
    url: '/pms/kb/favorite/list',
    params: { libraryId }
  })
}

export type { PmsKnowledgeInteractionItemVO } from '../types'
