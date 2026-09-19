import request from '@/config/axios'
import type { PmsKnowledgeInteractionItemVO } from '../types'

// PMS 知识最近浏览 VO
export interface PmsKnowledgeRecentListVO {
  todayItems: PmsKnowledgeInteractionItemVO[] // 今天浏览列表
  yesterdayItems: PmsKnowledgeInteractionItemVO[] // 昨天浏览列表
  recent30DayItems: PmsKnowledgeInteractionItemVO[] // 更早 30 天浏览列表
}

// 查询最近浏览列表
export const getKnowledgeRecentViewRecordList = (libraryId?: number) => {
  return request.get<PmsKnowledgeRecentListVO>({
    url: '/pms/kb/view-record/recent-list',
    params: { libraryId }
  })
}

export type { PmsKnowledgeInteractionItemVO } from '../types'
