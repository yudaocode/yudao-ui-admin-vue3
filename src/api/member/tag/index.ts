import request from '@/config/axios'

export interface TagVO {
  id: number
  name: string
}

// 查询会员标签列表
export const getMemberTagPage = async (params: any) => {
  return await request.get({ url: `/member/tag/page`, params })
}

// 查询会员标签详情
export const getMemberTag = async (id: number) => {
  return await request.get({ url: `/member/tag/get?id=` + id })
}

// 查询会员标签 - 精简信息列表
export const getSimpleTagList = async () => {
  return await request.get({ url: `/member/tag/list-all-simple` })
}

// 新增会员标签
export const createMemberTag = async (data: TagVO) => {
  return await request.post({ url: `/member/tag/create`, data })
}

// 修改会员标签
export const updateMemberTag = async (data: TagVO) => {
  return await request.put({ url: `/member/tag/update`, data })
}

// 删除会员标签
export const deleteMemberTag = async (id: number) => {
  return await request.delete({ url: `/member/tag/delete?id=` + id })
}
