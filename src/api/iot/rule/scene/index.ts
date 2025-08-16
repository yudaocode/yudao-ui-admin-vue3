import request from '@/config/axios'

// 场景联动
export interface IotSceneRule {
  id?: number // 场景编号
  name: string // 场景名称
  description?: string // 场景描述
  status: number // 场景状态：0-开启，1-关闭
  triggers: Trigger[] // 触发器数组
  actions: Action[] // 执行器数组
}

// 触发器结构
export interface Trigger {
  type: number // 触发类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 物模型标识符
  operator?: string // 操作符
  value?: string // 参数值
  cronExpression?: string // CRON 表达式
  conditionGroups?: TriggerCondition[][] // 条件组（二维数组）
}

// 触发条件结构
export interface TriggerCondition {
  type: number // 条件类型：1-设备状态，2-设备属性，3-当前时间
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 标识符
  operator: string // 操作符
  param: string // 参数
}

// 执行器结构
export interface Action {
  type: number // 执行类型
  productId?: number // 产品编号
  deviceId?: number // 设备编号
  identifier?: string // 物模型标识符（服务调用时使用）
  params?: string // 请求参数
  alertConfigId?: number // 告警配置编号
}

// IoT 场景联动 API
export const RuleSceneApi = {
  // 查询场景联动分页
  getRuleScenePage: async (params: any) => {
    return await request.get({ url: `/iot/scene-rule/page`, params })
  },

  // 查询场景联动详情
  getRuleScene: async (id: number) => {
    return await request.get({ url: `/iot/scene-rule/get?id=` + id })
  },

  // 新增场景联动
  createRuleScene: async (data: IotSceneRule) => {
    return await request.post({ url: `/iot/scene-rule/create`, data })
  },

  // 修改场景联动
  updateRuleScene: async (data: IotSceneRule) => {
    return await request.put({ url: `/iot/scene-rule/update`, data })
  },

  // 修改场景联动
  updateRuleSceneStatus: async (id: number, status: number) => {
    return await request.put({
      url: `/iot/scene-rule/update-status`,
      data: {
        id,
        status
      }
    })
  },

  // 删除场景联动
  deleteRuleScene: async (id: number) => {
    return await request.delete({ url: `/iot/scene-rule/delete?id=` + id })
  },

  // 获取场景联动简单列表
  getSimpleRuleSceneList: async () => {
    return await request.get({ url: `/iot/scene-rule/simple-list` })
  }
}
