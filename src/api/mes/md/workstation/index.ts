import request from '@/config/axios'

// TODO @AI：是不是每个 VO 独立文件；例如说 tool/ 、worker/、machine/ 等等

// MES 工位 VO
export interface MdWorkstationVO {
  id: number // 工位编号
  code: string // 工位编码
  name: string // 工位名称
  address: string // 工位地点
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

// MES 工位设备 VO
export interface MdWorkstationMachineVO {
  id: number
  workstationId: number // 工位 ID
  machineryId: number // 设备 ID
  machineryName: string // 设备名称
  machineryCode: string // 设备编码
  quantity: number // 数量
  remark: string // 备注
}

// MES 工位工具 VO
export interface MdWorkstationToolVO {
  id: number
  workstationId: number // 工位 ID
  toolTypeId: number // 工具类型 ID
  toolTypeName: string // 工具类型名称
  quantity: number // 数量
  remark: string // 备注
}

// MES 工位人员 VO
export interface MdWorkstationWorkerVO {
  id: number
  workstationId: number // 工位 ID
  postId: number // 岗位 ID
  postName: string // 岗位名称
  quantity: number // 数量
  remark: string // 备注
}

// MES 工位 API
export const MdWorkstationApi = {
  // 查询工位分页
  getWorkstationPage: async (params: any) => {
    return await request.get({ url: `/mes/md-workstation/page`, params })
  },

  // 查询工位精简列表
  getWorkstationSimpleList: async () => {
    return await request.get({ url: `/mes/md-workstation/simple-list` })
  },

  // 查询工位详情
  getWorkstation: async (id: number) => {
    return await request.get({ url: `/mes/md-workstation/get?id=` + id })
  },

  // 新增工位
  createWorkstation: async (data: MdWorkstationVO) => {
    return await request.post({ url: `/mes/md-workstation/create`, data })
  },

  // 修改工位
  updateWorkstation: async (data: MdWorkstationVO) => {
    return await request.put({ url: `/mes/md-workstation/update`, data })
  },

  // 删除工位
  deleteWorkstation: async (id: number) => {
    return await request.delete({ url: `/mes/md-workstation/delete?id=` + id })
  },

  // 导出工位 Excel
  exportWorkstation: async (params: any) => {
    return await request.download({ url: `/mes/md-workstation/export-excel`, params })
  }
}

// MES 工位设备 API
export const MdWorkstationMachineApi = {
  // 查询工位设备列表
  getWorkstationMachineList: async (workstationId: number) => {
    return await request.get({ url: `/mes/md-workstation-machine/list-by-workstation?workstationId=` + workstationId })
  },

  // 新增工位设备
  createWorkstationMachine: async (data: MdWorkstationMachineVO) => {
    return await request.post({ url: `/mes/md-workstation-machine/create`, data })
  },

  // 删除工位设备
  deleteWorkstationMachine: async (id: number) => {
    return await request.delete({ url: `/mes/md-workstation-machine/delete?id=` + id })
  }
}

// MES 工位工具 API
export const MdWorkstationToolApi = {
  // 查询工位工具列表
  getWorkstationToolList: async (workstationId: number) => {
    return await request.get({ url: `/mes/md-workstation-tool/list-by-workstation?workstationId=` + workstationId })
  },

  // 新增工位工具
  createWorkstationTool: async (data: MdWorkstationToolVO) => {
    return await request.post({ url: `/mes/md-workstation-tool/create`, data })
  },

  // 修改工位工具
  updateWorkstationTool: async (data: MdWorkstationToolVO) => {
    return await request.put({ url: `/mes/md-workstation-tool/update`, data })
  },

  // 删除工位工具
  deleteWorkstationTool: async (id: number) => {
    return await request.delete({ url: `/mes/md-workstation-tool/delete?id=` + id })
  }
}

// MES 工位人员 API
export const MdWorkstationWorkerApi = {
  // 查询工位人员列表
  getWorkstationWorkerList: async (workstationId: number) => {
    return await request.get({ url: `/mes/md-workstation-worker/list-by-workstation?workstationId=` + workstationId })
  },

  // 新增工位人员
  createWorkstationWorker: async (data: MdWorkstationWorkerVO) => {
    return await request.post({ url: `/mes/md-workstation-worker/create`, data })
  },

  // 修改工位人员
  updateWorkstationWorker: async (data: MdWorkstationWorkerVO) => {
    return await request.put({ url: `/mes/md-workstation-worker/update`, data })
  },

  // 删除工位人员
  deleteWorkstationWorker: async (id: number) => {
    return await request.delete({ url: `/mes/md-workstation-worker/delete?id=` + id })
  }
}
