import request from '@/config/axios'
import { IotRuleScene } from './scene.types'

// IoT 场景联动 API
export const RuleSceneApi = {
  // 查询场景联动分页
  getRuleScenePage: async (params: any) => {
    return await request.get({ url: `/iot/rule-scene/page`, params })
  },

  // 查询场景联动详情
  getRuleScene: async (id: number) => {
    return await request.get({ url: `/iot/rule-scene/get?id=` + id })
  },

  // 新增场景联动
  createRuleScene: async (data: IotRuleScene) => {
    return await request.post({ url: `/iot/rule-scene/create`, data })
  },

  // 修改场景联动
  updateRuleScene: async (data: IotRuleScene) => {
    return await request.put({ url: `/iot/rule-scene/update`, data })
  },

  // 删除场景联动
  deleteRuleScene: async (id: number) => {
    return await request.delete({ url: `/iot/rule-scene/delete?id=` + id })
  },

  // 获取场景联动简单列表
  getSimpleRuleSceneList: async () => {
    return await request.get({ url: `/iot/rule-scene/simple-list` })
  }
}
