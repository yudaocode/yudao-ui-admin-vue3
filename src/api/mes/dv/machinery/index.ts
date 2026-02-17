import request from '@/config/axios'

// MES 设备台账 VO
export interface DvMachineryVO {
  id: number // 编号
  code: string // 设备编码
  name: string // 设备名称
  brand: string // 品牌
  spec: string // 规格型号
  machineryTypeId: number // 设备类型编号
  machineryTypeName: string // 设备类型名称
  workshopId: number // 所属车间编号
  workshopName: string // 所属车间名称
  status: number // 设备状态
  lastMaintenTime: Date // 最近保养时间
  lastCheckTime: Date // 最近点检时间
  remark: string // 备注
}

// MES 设备台账 API
export const DvMachineryApi = {
  // 查询设备台账分页
  getMachineryPage: async (params: any) => {
    return await request.get({ url: `/mes/dv/machinery/page`, params })
  },

  // 查询设备台账详情
  getMachinery: async (id: number) => {
    return await request.get({ url: `/mes/dv/machinery/get?id=` + id })
  },

  // 新增设备台账
  createMachinery: async (data: DvMachineryVO) => {
    return await request.post({ url: `/mes/dv/machinery/create`, data })
  },

  // 修改设备台账
  updateMachinery: async (data: DvMachineryVO) => {
    return await request.put({ url: `/mes/dv/machinery/update`, data })
  },

  // 删除设备台账
  deleteMachinery: async (id: number) => {
    return await request.delete({ url: `/mes/dv/machinery/delete?id=` + id })
  },

  // 导出设备台账 Excel
  exportMachinery: async (params: any) => {
    return await request.download({ url: `/mes/dv/machinery/export-excel`, params })
  },

  // 下载设备导入模板
  importTemplate: async () => {
    return await request.download({ url: `/mes/dv/machinery/get-import-template` })
  }
}
