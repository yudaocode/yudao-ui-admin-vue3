import request from '@/config/axios'

export interface MailAccountVO {
  id?: number // 账号编号
  providerId: number | undefined // 服务配置编号
  mail: string // 邮箱地址
  userName?: string // 归属人姓名
  username: string // 登录用户名
  password?: string // 密码或授权码，修改时留空表示不变
  defaultStatus: boolean // 是否默认发件账号
  status: number // 状态
}

// 查询当前租户启用邮箱及归属人姓名
export const getSimpleMailAccountList = (): Promise<MailAccountVO[]> => {
  return request.get({ url: '/oa/mail-account/simple-list' })
}

// 查询本人账号列表
export const getMailAccountList = (status?: number): Promise<MailAccountVO[]> => {
  return request.get({ url: '/oa/mail-account/list', params: { status } })
}

// 查询本人账号
export const getMailAccount = (id: number) => {
  return request.get({ url: '/oa/mail-account/get', params: { id } })
}

// 绑定本人账号
export const createMailAccount = (data: MailAccountVO) => {
  return request.post({ url: '/oa/mail-account/create', data })
}

// 修改本人账号
export const updateMailAccount = (data: MailAccountVO) => {
  return request.put({ url: '/oa/mail-account/update', data })
}

// 设置默认账号
export const updateMailAccountDefault = (id: number) => {
  return request.put({ url: '/oa/mail-account/update-default', params: { id } })
}

// 移除绑定
export const deleteMailAccount = (id: number) => {
  return request.delete({ url: '/oa/mail-account/delete', params: { id } })
}

// 测试连接，不发送邮件
export const testMailAccountConnection = (id: number) => {
  return request.post({ url: '/oa/mail-account/test-connection', params: { id }, timeout: 60000 })
}
