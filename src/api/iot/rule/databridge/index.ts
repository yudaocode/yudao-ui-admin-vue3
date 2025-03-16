import request from '@/config/axios'

// IoT 数据桥梁 VO
export interface DataBridgeVO {
  id?: number // 桥梁编号
  name?: string // 桥梁名称
  description?: string // 桥梁描述
  status?: number // 桥梁状态
  direction?: number // 桥梁方向
  type?: number // 桥梁类型
  config?:
    | HttpConfig
    | MqttConfig
    | RocketMQConfig
    | KafkaMQConfig
    | RabbitMQConfig
    | RedisStreamMQConfig // 桥梁配置
}

interface Config {
  type: string
}

/** HTTP 配置 */
export interface HttpConfig extends Config {
  url: string
  method: string
  headers: Record<string, string>
  query: Record<string, string>
  body: string
}

/** MQTT 配置 */
export interface MqttConfig extends Config {
  url: string
  username: string
  password: string
  clientId: string
  topic: string
}

/** RocketMQ 配置 */
export interface RocketMQConfig extends Config {
  nameServer: string
  accessKey: string
  secretKey: string
  group: string
  topic: string
  tags: string
}

/** Kafka 配置 */
export interface KafkaMQConfig extends Config {
  bootstrapServers: string
  username: string
  password: string
  ssl: boolean
  topic: string
}

/** RabbitMQ 配置 */
export interface RabbitMQConfig extends Config {
  host: string
  port: number
  virtualHost: string
  username: string
  password: string
  exchange: string
  routingKey: string
  queue: string
}

/** Redis Stream MQ 配置 */
export interface RedisStreamMQConfig extends Config {
  host: string
  port: number
  password: string
  database: number
  topic: string
}

/** 数据桥梁类型 */
// TODO @puhui999：枚举用 number 可以么？
export const IoTDataBridgeConfigType = {
  HTTP: '1',
  TCP: '2',
  WEBSOCKET: '3',
  MQTT: '10',
  DATABASE: '20',
  REDIS_STREAM: '21',
  ROCKETMQ: '30',
  RABBITMQ: '31',
  KAFKA: '32'
} as const

// 数据桥梁 API
export const DataBridgeApi = {
  // 查询数据桥梁分页
  getDataBridgePage: async (params: any) => {
    return await request.get({ url: `/iot/data-bridge/page`, params })
  },

  // 查询数据桥梁详情
  getDataBridge: async (id: number) => {
    return await request.get({ url: `/iot/data-bridge/get?id=` + id })
  },

  // 新增数据桥梁
  createDataBridge: async (data: DataBridgeVO) => {
    return await request.post({ url: `/iot/data-bridge/create`, data })
  },

  // 修改数据桥梁
  updateDataBridge: async (data: DataBridgeVO) => {
    return await request.put({ url: `/iot/data-bridge/update`, data })
  },

  // 删除数据桥梁
  deleteDataBridge: async (id: number) => {
    return await request.delete({ url: `/iot/data-bridge/delete?id=` + id })
  },

  // 导出数据桥梁 Excel
  exportDataBridge: async (params) => {
    return await request.download({ url: `/iot/data-bridge/export-excel`, params })
  }
}
