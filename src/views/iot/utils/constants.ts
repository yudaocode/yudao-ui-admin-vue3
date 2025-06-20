/** iot 依赖注入 KEY */
export const IOT_PROVIDE_KEY = {
  PRODUCT: 'IOT_PRODUCT'
}

/**
 * IoT 设备消息的方法枚举
 */
export const IotDeviceMessageMethodEnum = {
  // ========== 设备状态 ==========
  STATE_ONLINE: {
    method: 'thing.state.online',
    name: '设备上线',
    upstream: true
  },
  STATE_OFFLINE: {
    method: 'thing.state.offline',
    name: '设备下线',
    upstream: true
  },

  // ========== 设备属性 ==========
  PROPERTY_POST: {
    method: 'thing.property.post',
    name: '属性上报',
    upstream: true
  },
  PROPERTY_SET: {
    method: 'thing.property.set',
    name: '属性设置',
    upstream: false
  },

  // ========== 设备事件 ==========
  EVENT_POST: {
    method: 'thing.event.post',
    name: '事件上报',
    upstream: true
  },

  // ========== 服务调用 ==========
  SERVICE_INVOKE: {
    method: 'thing.service.invoke',
    name: '服务调用',
    upstream: false
  },

  // ========== 设备配置 ==========
  CONFIG_PUSH: {
    method: 'thing.config.push',
    name: '配置推送',
    upstream: false
  }
}
