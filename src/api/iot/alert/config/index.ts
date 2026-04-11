import request from '@/config/axios'

/** IoT 告警配置信息 */
export interface AlertConfig {
  id: number // 配置编号
  name?: string // 配置名称
  description: string // 配置描述
  level?: number // 告警级别
  status?: number // 配置状态
  sceneRuleIds: string // 关联的场景联动规则编号数组
  receiveUserIds: string // 接收的用户编号数组
  receiveTypes: string // 接收的类型数组
}

// IoT 告警配置 API
export const AlertConfigApi = {
  // 查询告警配置分页
  getAlertConfigPage: async (params: any) => {
    return await request.get({ url: `/iot/alert-config/page`, params })
  },

  // 查询告警配置详情
  getAlertConfig: async (id: number) => {
    return await request.get({ url: `/iot/alert-config/get?id=` + id })
  },

  // 新增告警配置
  createAlertConfig: async (data: AlertConfig) => {
    return await request.post({ url: `/iot/alert-config/create`, data })
  },

  // 修改告警配置
  updateAlertConfig: async (data: AlertConfig) => {
    return await request.put({ url: `/iot/alert-config/update`, data })
  },

  // 删除告警配置
  deleteAlertConfig: async (id: number) => {
    return await request.delete({ url: `/iot/alert-config/delete?id=` + id })
  },

  // 获取告警配置简单列表
  getSimpleAlertConfigList: async () => {
    return await request.get({ url: `/iot/alert-config/simple-list` })
  }
}
