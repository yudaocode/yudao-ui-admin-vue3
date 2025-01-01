import request from '@/config/axios'

// IoT 插件信息 VO
export interface PluginInfoVO {
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

// IoT 插件信息 API
export const PluginInfoApi = {
  // 查询IoT 插件信息分页
  getPluginInfoPage: async (params: any) => {
    return await request.get({ url: `/iot/plugin-info/page`, params })
  },

  // 查询IoT 插件信息详情
  getPluginInfo: async (id: number) => {
    return await request.get({ url: `/iot/plugin-info/get?id=` + id })
  },

  // 新增IoT 插件信息
  createPluginInfo: async (data: PluginInfoVO) => {
    return await request.post({ url: `/iot/plugin-info/create`, data })
  },

  // 修改IoT 插件信息
  updatePluginInfo: async (data: PluginInfoVO) => {
    return await request.put({ url: `/iot/plugin-info/update`, data })
  },

  // 删除IoT 插件信息
  deletePluginInfo: async (id: number) => {
    return await request.delete({ url: `/iot/plugin-info/delete?id=` + id })
  },

  // 导出IoT 插件信息 Excel
  exportPluginInfo: async (params) => {
    return await request.download({ url: `/iot/plugin-info/export-excel`, params })
  },

  // 修改IoT 插件状态
  updatePluginStatus: async (data: any) => {
    return await request.put({ url: `/iot/plugin-info/update-status`, data })
  },

  // 上传Jar包
  uploadPluginFile: async (data: any) => {
    return await request.post({ url: `/iot/plugin-info/upload-file`, data })
  }
}
