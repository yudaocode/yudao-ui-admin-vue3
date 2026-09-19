import request from '@/config/axios'

// PMS 工作项动态 VO
export interface PmsWorkItemActivityVO {
  id: number // 动态编号
  workItemId: number // 工作项编号
  operatorUserId: number // 操作人用户编号
  operatorUserName?: string // 操作人姓名
  operatorUserAvatar?: string // 操作人头像
  content: string // 动态内容
  createTime: number // 创建时间
}

// 查询工作项动态列表
export const getWorkItemActivityList = (workItemId: number) => {
  return request.get<PmsWorkItemActivityVO[]>({
    url: '/pms/pm/work-item-activity/list',
    params: { workItemId }
  })
}
