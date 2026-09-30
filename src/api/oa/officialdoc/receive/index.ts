import request from '@/config/axios'

export interface OfficialDocReceiveVO {
  id?: number // 编号
  sendId?: number // 来源发文编号
  sendDeptName?: string // 发文部门
  issueTime?: string // 发文日期
  signerName?: string // 签发人
  disclosureType?: number // 公开类别
  receiveType?: number // 收文类型
  receiveTime?: string // 收文时间
  receiveDeptId?: number // 收文部门编号
  handlerUserId?: number // 主办人用户编号
  instruction?: string // 领导批示
  result?: string // 办理结果
  deadlineTime?: string // 办理期限
  summary?: string // 内容摘要
  remark?: string // 备注
  fileUrls?: string[] // 附件地址列表
  no?: string // 单据编号
  title?: string // 公文标题
  documentNo?: string // 来文字号
  secrecyLevel?: number // 密级
  urgencyLevel?: number // 紧急程度
  formalFileUrl?: string // 正式公文地址
  receiveDeptName?: string // 收文部门
  handlerName?: string // 主办人
  status?: number // 审批状态
  handleStatus?: number // 办理状态
  processInstanceId?: string // 流程实例编号
  creator?: string // 创建人编号
  createTime?: string // 创建时间
}

// 查询公文收文分页
export const getReceivePage = (params: PageParam) => {
  return request.get({ url: '/oa/officialdoc-receive/page', params })
}

// 查询公文收文
export const getReceive = (id: number) => {
  return request.get({ url: '/oa/officialdoc-receive/get', params: { id } })
}

// 新增公文收文
export const createReceive = (data: OfficialDocReceiveVO) => {
  return request.post({ url: '/oa/officialdoc-receive/create', data })
}

// 修改公文收文
export const updateReceive = (data: OfficialDocReceiveVO) => {
  return request.put({ url: '/oa/officialdoc-receive/update', data })
}

// 删除公文收文
export const deleteReceive = (id: number) => {
  return request.delete({ url: '/oa/officialdoc-receive/delete', params: { id } })
}

// 提交公文收文
export const submitReceive = (id: number) => {
  return request.post({ url: '/oa/officialdoc-receive/submit', params: { id } })
}

// 撤销公文收文
export const cancelReceive = (id: number) => {
  return request.put({ url: '/oa/officialdoc-receive/cancel', params: { id } })
}

// 签收公文收文
export const claimReceive = (id: number) => {
  return request.put({ url: '/oa/officialdoc-receive/claim', params: { id } })
}
