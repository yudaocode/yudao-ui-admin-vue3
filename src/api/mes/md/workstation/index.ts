import request from '@/config/axios'

// MES 工作站 VO
export interface MdWorkstationVO {
  id: number // 工作站编号
  code: string // 工作站编码
  name: string // 工作站名称
  address: string // 工作站地点
  workshopId: number // 所在车间 ID
  workshopName: string // 所在车间名称
  processId: number // 工序 ID
  warehouseId: number // 线边库 ID
  locationId: number // 库区 ID
  areaId: number // 库位 ID
  status: number // 状态
  remark: string // 备注
  attribute1: string
  attribute2: string
  attribute3: number
  attribute4: number
}

// MES 工作站 API
export const MdWorkstationApi = {
  // 查询工作站分页
  getWorkstationPage: async (params: any) => {
    return await request.get({ url: `/mes/md-workstation/page`, params })
  },

  // 查询工作站精简列表
  getWorkstationSimpleList: async () => {
    return await request.get({ url: `/mes/md-workstation/simple-list` })
  },

  // 查询工作站详情
  getWorkstation: async (id: number) => {
    return await request.get({ url: `/mes/md-workstation/get?id=` + id })
  },

  // 新增工作站
  createWorkstation: async (data: MdWorkstationVO) => {
    return await request.post({ url: `/mes/md-workstation/create`, data })
  },

  // 修改工作站
  updateWorkstation: async (data: MdWorkstationVO) => {
    return await request.put({ url: `/mes/md-workstation/update`, data })
  },

  // 删除工作站
  deleteWorkstation: async (id: number) => {
    return await request.delete({ url: `/mes/md-workstation/delete?id=` + id })
  },

  // 导出工作站 Excel
  exportWorkstation: async (params: any) => {
    return await request.download({ url: `/mes/md-workstation/export-excel`, params })
  }
}
