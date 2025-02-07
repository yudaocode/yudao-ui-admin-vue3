import request from '@/config/axios'

// IoT 插件配置 VO
export interface PluginConfigVO {
  id: number // 主键ID
  pluginKey: string // 插件标识
  name: string // 插件名称
  description: string // 描述
  deployType: number // 部署方式
  fileName: string // 插件包文件名
  version: string // 插件版本
  type: number // 插件类型
  protocol: string // 设备插件协议类型
  status: number // 状态
  configSchema: string // 插件配置项描述信息
  config: string // 插件配置信息
  script: string // 插件脚本
}

// IoT 插件配置 API
export const PluginConfigApi = {
  // 查询插件配置分页
  getPluginConfigPage: async (params: any) => {
    return await request.get({ url: `/iot/plugin-config/page`, params })
  },

  // 查询插件配置详情
  getPluginConfig: async (id: number) => {
    return await request.get({ url: `/iot/plugin-config/get?id=` + id })
  },

  // 新增插件配置
  createPluginConfig: async (data: PluginConfigVO) => {
    return await request.post({ url: `/iot/plugin-config/create`, data })
  },

  // 修改插件配置
  updatePluginConfig: async (data: PluginConfigVO) => {
    return await request.put({ url: `/iot/plugin-config/update`, data })
  },

  // 删除插件配置
  deletePluginConfig: async (id: number) => {
    return await request.delete({ url: `/iot/plugin-config/delete?id=` + id })
  },

  // 修改插件状态
  updatePluginStatus: async (data: any) => {
    return await request.put({ url: `/iot/plugin-config/update-status`, data })
  }
}
