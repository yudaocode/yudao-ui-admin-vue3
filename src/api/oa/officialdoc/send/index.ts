import request from '@/config/axios'

export interface OfficialDocSendVO {
  id?: number // 编号
  templateId?: number // 套红模板编号
  title?: string // 公文标题
  noPrefix?: string // 字号
  year?: number // 年份
  sequence?: number // 第几号文
  secrecyLevel?: number // 密级
  urgencyLevel?: number // 紧急程度
  disclosureType?: number // 公开类别
  issueTime?: string // 发文日期
  sendDeptId?: number // 发文部门编号
  mainDeptIds?: number[] // 主送部门编号列表
  copyDeptIds?: number[] // 抄送部门编号列表
  content?: string // 公文正文
  fileUrls?: string[] // 附件地址列表
  formalFileUrl?: string // 正式公文地址
  remark?: string // 附注
  no?: string // 单据编号
  documentNo?: string // 公文文号
  signerUserId?: number // 签发人编号
  signerName?: string // 签发人
  sendDeptName?: string // 发文部门
  mainDeptNames?: string[] // 主送部门
  copyDeptNames?: string[] // 抄送部门
  status?: number // 审批状态
  processInstanceId?: string // 流程实例编号
  creator?: string // 创建人编号
  createTime?: string // 创建时间
}

// 查询公文发文分页
export const getSendPage = (params: PageParam) => {
  return request.get({ url: '/oa/officialdoc-send/page', params })
}

// 查询公文发文
export const getSend = (id: number) => {
  return request.get({ url: '/oa/officialdoc-send/get', params: { id } })
}

// 新增公文发文
export const createSend = (data: OfficialDocSendVO) => {
  return request.post({ url: '/oa/officialdoc-send/create', data })
}

// 修改公文发文
export const updateSend = (data: OfficialDocSendVO) => {
  return request.put({ url: '/oa/officialdoc-send/update', data })
}

// 删除公文发文
export const deleteSend = (id: number) => {
  return request.delete({ url: '/oa/officialdoc-send/delete', params: { id } })
}

// 提交公文发文
export const submitSend = (id: number) => {
  return request.post({ url: '/oa/officialdoc-send/submit', params: { id } })
}

// 撤销公文发文
export const cancelSend = (id: number) => {
  return request.put({ url: '/oa/officialdoc-send/cancel', params: { id } })
}
