import request from '@/config/axios'

// MES 安灯配置 VO
export interface ProAndonConfigVO {
  id: number // 编号
  reason: string // 呼叫原因
  level: number // 级别
  handlerRoleId: number // 处置人角色编号
  handlerUserId: number // 处置人编号
  handlerUserNickname: string // 处置人昵称
  remark: string // 备注
}

// MES 安灯配置 API
export const ProAndonConfigApi = {
  // 查询安灯配置分页
  getAndonConfigPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/andon-config/page`, params })
  },

  // 查询安灯配置列表
  getAndonConfigList: async () => {
    return await request.get({ url: `/mes/pro/andon-config/list` })
  },

  // 查询安灯配置详情
  getAndonConfig: async (id: number) => {
    return await request.get({ url: `/mes/pro/andon-config/get?id=` + id })
  },

  // 新增安灯配置
  createAndonConfig: async (data: ProAndonConfigVO) => {
    return await request.post({ url: `/mes/pro/andon-config/create`, data })
  },

  // 修改安灯配置
  updateAndonConfig: async (data: ProAndonConfigVO) => {
    return await request.put({ url: `/mes/pro/andon-config/update`, data })
  },

  // 删除安灯配置
  deleteAndonConfig: async (id: number) => {
    return await request.delete({ url: `/mes/pro/andon-config/delete?id=` + id })
  }
}
