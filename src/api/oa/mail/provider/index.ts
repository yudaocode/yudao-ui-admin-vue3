import request from '@/config/axios'

// 查询服务配置精简列表
export const getSimpleMailProviderList = () => request.get({ url: '/oa/mail-provider/simple-list' })

export interface MailConnectionConfig {
  host: string // 服务器域名
  port: number // 服务器端口
  sslEnable: boolean // 是否开启 SSL
  starttlsEnable: boolean // 是否开启 STARTTLS
}

export interface MailProviderVO {
  id?: number // 服务配置编号
  name: string // 名称
  imap: MailConnectionConfig // 收信连接
  smtp: MailConnectionConfig // 发信连接
  status: number // 状态
}

// 查询服务配置列表
export const getMailProviderList = (status?: number) =>
  request.get<MailProviderVO[]>({ url: '/oa/mail-provider/list', params: { status } })

// 查询服务配置
export const getMailProvider = (id: number) =>
  request.get({ url: '/oa/mail-provider/get', params: { id } })

// 新增服务配置
export const createMailProvider = (data: MailProviderVO) =>
  request.post({ url: '/oa/mail-provider/create', data })

// 修改服务配置
export const updateMailProvider = (data: MailProviderVO) =>
  request.put({ url: '/oa/mail-provider/update', data })

// 删除服务配置
export const deleteMailProvider = (id: number) =>
  request.delete({ url: '/oa/mail-provider/delete', params: { id } })
