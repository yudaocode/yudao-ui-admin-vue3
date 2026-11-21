import request from '@/config/axios'

/** OPC UA 连接配置 VO */
export interface DeviceOpcUaConfigVO {
  id?: number // 主键
  deviceId: number // 设备编号
  endpointUrl: string // 端点地址，例如 opc.tcp://192.168.1.10:4840
  securityPolicy: string // 安全策略
  securityMode: string // 安全模式
  authType: number // 认证方式
  credentialAlias: string // 凭据别名（账号口令保存在网关本地）
  timeout: number // 请求超时，单位：毫秒
  retryInterval: number // 重试间隔，单位：毫秒
  status: number // 状态
}

/** OPC UA 连接配置 API */
export const DeviceOpcUaConfigApi = {
  /** 获取设备的 OPC UA 连接配置 */
  getOpcUaConfig: async (deviceId: number) => {
    return await request.get<DeviceOpcUaConfigVO>({
      url: `/iot/device-opc-ua-config/get`,
      params: { deviceId }
    })
  },

  /** 保存 OPC UA 连接配置 */
  saveOpcUaConfig: async (data: DeviceOpcUaConfigVO) => {
    return await request.post({ url: `/iot/device-opc-ua-config/save`, data })
  }
}
