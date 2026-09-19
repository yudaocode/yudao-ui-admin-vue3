import request from '@/config/axios'

export interface SealApplyVO {
  id?: number // 编号
  sealId?: number // 印章编号
  reason?: string // 用印事由
  type?: number // 用印类型
  mode?: number // 用印方式
  documentTitle?: string // 文件标题
  documentType?: string // 文件类型
  documentCount?: number // 文件份数
  contractPrice?: number // 合同金额
  contractParty?: string // 合同对方
  expectedUseTime?: string // 预计用印时间
  expectedReturnTime?: string // 预计归还时间
  urgent?: boolean // 是否紧急
  remark?: string // 备注
  fileUrls?: string[] // 附件地址列表
  no?: string // 申请单号
  sealNo?: string // 印章编号
  sealName?: string // 印章名称
  sealType?: number // 印章类型快照
  keeperDeptId?: number // 保管部门编号快照
  keeperDeptName?: string // 保管部门
  userId?: number // 申请人编号
  deptId?: number // 申请部门编号
  userName?: string // 申请人
  deptName?: string // 申请部门
  keeperUserId?: number // 保管人编号
  keeperName?: string // 保管人
  status?: number // 审批状态
  useStatus?: number // 用印状态
  processInstanceId?: string // 流程实例编号
  actualUseTime?: string // 实际用印时间
  actualReturnTime?: string // 实际归还时间
  createTime?: string // 创建时间
}

// 查询本人用印申请分页
export const getSealApplyPage = (params: PageParam) => {
  return request.get({ url: '/oa/seal-apply/page', params })
}

// 查询用印申请详情
export const getSealApply = (id: number) => {
  return request.get({ url: '/oa/seal-apply/get', params: { id } })
}

// 查询可申请的印章分页
export const getSealPage = (params: PageParam) => {
  return request.get({ url: '/oa/seal-apply/seal-page', params })
}

// 新增用印申请
export const createSealApply = (data: SealApplyVO) => {
  return request.post({ url: '/oa/seal-apply/create', data })
}

// 修改用印申请
export const updateSealApply = (data: SealApplyVO) => {
  return request.put({ url: '/oa/seal-apply/update', data })
}

// 删除用印草稿
export const deleteSealApply = (id: number) => {
  return request.delete({ url: '/oa/seal-apply/delete', params: { id } })
}

// 提交用印申请
export const submitSealApply = (id: number) => {
  return request.put({ url: '/oa/seal-apply/submit', params: { id } })
}

// 撤销用印申请
export const cancelSealApply = (id: number) => {
  return request.put({ url: '/oa/seal-apply/cancel', params: { id } })
}
