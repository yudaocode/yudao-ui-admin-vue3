import request from '@/config/axios'

// TODO @AI：是不是独立文件夹

// MES 车间 VO
export interface MdWorkshopVO {
  id: number // 车间编号
  code: string // 车间编码
  name: string // 车间名称
  area: number // 面积
  chargeUserId: number // 负责人用户编号
  chargeUserName: string // 负责人名称
  status: number // 状态
  remark: string // 备注
  attribute1: string // 预留字段1
  attribute2: string // 预留字段2
  attribute3: number // 预留字段3
  attribute4: number // 预留字段4
}

// MES 车间 API
export const MdWorkshopApi = {
  // 查询车间分页
  getWorkshopPage: async (params: any) => {
    return await request.get({ url: `/mes/md-workshop/page`, params })
  },

  // 查询车间精简列表
  getWorkshopSimpleList: async () => {
    return await request.get({ url: `/mes/md-workshop/simple-list` })
  },

  // 查询车间详情
  getWorkshop: async (id: number) => {
    return await request.get({ url: `/mes/md-workshop/get?id=` + id })
  },

  // 新增车间
  createWorkshop: async (data: MdWorkshopVO) => {
    return await request.post({ url: `/mes/md-workshop/create`, data })
  },

  // 修改车间
  updateWorkshop: async (data: MdWorkshopVO) => {
    return await request.put({ url: `/mes/md-workshop/update`, data })
  },

  // 删除车间
  deleteWorkshop: async (id: number) => {
    return await request.delete({ url: `/mes/md-workshop/delete?id=` + id })
  },

  // 导出车间 Excel
  exportWorkshop: async (params: any) => {
    return await request.download({ url: `/mes/md-workshop/export-excel`, params })
  }
}
