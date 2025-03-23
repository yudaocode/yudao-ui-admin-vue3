import request from '@/config/axios'
import { IotRuleSceneTriggerConfig } from '@/api/iot/rule/scene/scene.types'

// IoT 规则场景（场景联动） VO
export interface RuleSceneVO {
  id?: number // 场景编号
  name: string // 场景名称
  description?: string // 场景描述
  status: number // 场景状态
  triggers: IotRuleSceneTriggerConfig[] // 触发器数组
  actions?: any[] // 执行器数组
}

// IoT 规则场景（场景联动） API
export const RuleSceneApi = {
  // 查询规则场景（场景联动）分页
  getRuleScenePage: async (params: any) => {
    return await request.get({ url: `/iot/rule-scene/page`, params })
  },

  // 查询规则场景（场景联动）详情
  getRuleScene: async (id: number) => {
    return await request.get({ url: `/iot/rule-scene/get?id=` + id })
  },

  // 新增规则场景（场景联动）
  createRuleScene: async (data: RuleSceneVO) => {
    return await request.post({ url: `/iot/rule-scene/create`, data })
  },

  // 修改规则场景（场景联动）
  updateRuleScene: async (data: RuleSceneVO) => {
    return await request.put({ url: `/iot/rule-scene/update`, data })
  },

  // 删除规则场景（场景联动）
  deleteRuleScene: async (id: number) => {
    return await request.delete({ url: `/iot/rule-scene/delete?id=` + id })
  }
}
