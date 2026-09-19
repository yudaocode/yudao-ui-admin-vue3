import request from '@/config/axios'

export interface OaContactVO {
  id?: number // 联系人编号
  ownerUserId?: number // 创建人用户编号
  ownerUserName?: string // 创建人用户昵称
  categoryId?: number // 分类编号
  categoryName?: string // 分类名称
  name: string // 姓名
  pinyin?: string // 姓名拼音
  sex?: number // 性别
  mobile?: string // 手机号码
  email?: string // 邮箱
  address?: string // 地址
  companyName?: string // 公司名称
  companyPhone?: string // 公司电话
  avatar?: string // 头像地址
  remark?: string // 备注
  shares?: OaContactShareVO[] // 共享记录列表
  share?: OaContactShareVO // 我共享的列表中当前行的接收关系
  sharerName?: string // 分享给当前用户的共享人昵称
  handleStatus?: boolean // 当前接收人的处理状态
  sharedCategoryId?: number // 当前接收人的分类编号
  sharedCategoryName?: string // 当前接收人的分类名称
  createTime?: string // 创建时间
}

export interface OaContactShareVO {
  creatorName?: string // 实际共享人昵称
  id: number // 共享记录编号
  userId: number // 共享接收人用户编号
  userName?: string // 共享接收人用户昵称
  userAvatar?: string // 共享接收人用户头像
  categoryId?: number // 接收人的分类编号
  categoryName?: string // 接收人的分类名称
  handleStatus: boolean // 处理状态
  createTime: string // 共享时间
}

// 查询我的联系人分页
export const getMyContactPage = (params: PageParam) => {
  return request.get({ url: '/oa/contact/my-page', params })
}

// 查询共享给我的联系人分页
export const getReceivedContactPage = (params: PageParam) => {
  return request.get({ url: '/oa/contact/received-page', params })
}

// 查询我共享的联系人分页
export const getSharedContactPage = (params: PageParam) => {
  return request.get({ url: '/oa/contact/shared-page', params })
}

// 查询联系人详情
export const getContact = (id: number): Promise<OaContactVO> => {
  return request.get({ url: '/oa/contact/get', params: { id } })
}

// 新增联系人
export const createContact = (data: OaContactVO) => {
  return request.post({ url: '/oa/contact/create', data })
}

// 修改联系人
export const updateContact = (data: OaContactVO) => {
  return request.put({ url: '/oa/contact/update', data })
}

// 删除联系人
export const deleteContact = (id: number) => {
  return request.delete({ url: '/oa/contact/delete', params: { id } })
}

// 删除接收到的共享联系人
export const deleteReceivedContact = (contactId: number) => {
  return request.delete({ url: '/oa/contact/delete-received', params: { contactId } })
}

// 共享联系人
export const shareContact = (contactId: number, userIds: number[]) => {
  return request.post({ url: '/oa/contact/share', data: { contactId, userIds } })
}

// 处理联系人共享
export const handleContactShare = (contactId: number, categoryId?: number) => {
  return request.put({ url: '/oa/contact/handle-share', data: { contactId, categoryId } })
}
