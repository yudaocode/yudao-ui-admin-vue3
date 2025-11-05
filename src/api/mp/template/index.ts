import request from '@/config/axios'

// 消息模板 VO
export interface MsgTemplateVO {
    id: number // 主键
    appId: string // appid
    templateId: string // 公众号模板ID
    name: string // 模版名称
    title: string // 标题
    content: string // 模板内容
    data: string // 消息内容
    url: string // 链接
    //miniprogram: string // 小程序信息
    miniProgramAppId: string
    miniProgramPagePath: string
    isRemoved: number
    configId: number
    templateType: number
    status: number // 是否有效
}

// 消息模板 API
export const MsgTemplateApi = {
    // 查询消息模板分页
    getMsgTemplatePage: async (params: any) => {
        return await request.get({ url: `/mp/template/page`, params })
    },

    // 查询消息模板详情
    getMsgTemplate: async (id: number) => {
        return await request.get({ url: `/mp/template/get?id=` + id })
    },

    // 新增消息模板
    createMsgTemplate: async (data: MsgTemplateVO) => {
        return await request.post({ url: `/mp/template/create`, data })
    },

    // 修改消息模板
    updateMsgTemplate: async (data: MsgTemplateVO) => {
        return await request.put({ url: `/mp/template/update`, data })
    },

    // 删除消息模板
    deleteMsgTemplate: async (id: number) => {
        return await request.delete({ url: `/mp/template/delete?id=` + id })
    },

    // 导出消息模板 Excel
    exportMsgTemplate: async (params) => {
        return await request.download({ url: `/mp/template/export-excel`, params })
    },

    // 同步公众号模板
    syncMsgTemplate: async (params: any) => {
        return await request.get({ url: `/mp/template/syncMsgTemplate`,params})
    },

    // 同步公众号模板
    sendMsgBatch: async (data: any) => {
        return await request.post({ url: `/mp/template/sendMsgBatch`,data})
    },

    deleteList: async (data: any) => {
        return await request.delete({ url: `/mp/template/delete-list`,data})
    },
}

// 微信模版消息发送记录 VO
export interface MsgTemplateLogVO {
    id: number // 主键
    appId: string // appId
    toUser: string // 用户openid
    templateId: string // 公众号模板ID
    data: string // 消息内容
    url: string // 链接
    miniProgramAppId: string // 小程序appid
    miniProgramPagePath: string // 小程序页面路径
    sendTime: Date // 发送时间
    sendStatus: string // 发送状态 0成功，1失败
    sendResult: string // 发送结果
}

// 微信模版消息发送记录 API
export const MsgTemplateLogApi = {
    // 查询微信模版消息发送记录分页
    getMsgTemplateLogPage: async (params: any) => {
        return await request.get({ url: `/mp/template/log/page`, params })
    },

    // 查询微信模版消息发送记录详情
    getMsgTemplateLog: async (id: number) => {
        return await request.get({ url: `/mp/template/log/get?id=` + id })
    },

    // 新增微信模版消息发送记录
    createMsgTemplateLog: async (data: MsgTemplateLogVO) => {
        return await request.post({ url: `/mp/template/log/create`, data })
    },

    // 修改微信模版消息发送记录
    updateMsgTemplateLog: async (data: MsgTemplateLogVO) => {
        return await request.put({ url: `/mp/template/log/update`, data })
    },

    // 删除微信模版消息发送记录
    deleteMsgTemplateLog: async (id: number) => {
        return await request.delete({ url: `/mp/template/log/delete?id=` + id })
    },

    // 导出微信模版消息发送记录 Excel
    exportMsgTemplateLog: async (params) => {
        return await request.download({ url: `/mp/template/log/export-excel`, params })
    },
}