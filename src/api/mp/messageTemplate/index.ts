import request from '@/config/axios'

// 消息模板 VO
export interface MsgTemplateVO {
  id: number // 模版主键
  accountId: number // 公众号账号的编号
  appId: string // appId
  templateId: string // 公众号模板 ID
  title: string // 标题
  content: string // 模板内容
  example: string // 模板示例
  primaryIndustry: string // 模板所属行业的一级行业
  deputyIndustry: string // 模板所属行业的二级行业
  createTime: Date // 创建时间
}

// 发送消息模板请求 VO
export interface MsgTemplateSendVO {
  id: number // 模板编号
  userId: number // 用户编号
  data?: string // 模板数据（JSON 格式字符串）
  url?: string // 跳转链接
  miniProgramAppId?: string // 小程序 appId
  miniProgramPagePath?: string // 小程序页面路径
  miniprogram?: string // 小程序信息（JSON 格式字符串）
}

// 公众号消息模板 API
export const MessageTemplateApi = {
  // 查询消息模板分页
  getMessageTemplateList: async (params: any) => {
    return await request.get({ url: `/mp/message-template/list`, params })
  },

  // 删除消息模板
  deleteMessageTemplate: async (id: number) => {
    return await request.delete({ url: `/mp/message-template/delete?id=` + id })
  },

  // 同步公众号模板
  syncMessageTemplate: async (accountId: number) => {
    return await request.post({ url: `/mp/message-template/sync?accountId=` + accountId })
  },

  // 发送消息模板
  sendMessageTemplate: async (data: MsgTemplateSendVO) => {
    return await request.post({ url: `/mp/message-template/send`, data })
  }
}
