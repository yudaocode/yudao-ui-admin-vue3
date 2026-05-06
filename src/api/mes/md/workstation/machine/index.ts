import request from '@/config/axios'

// MES 设备资源 VO
export interface MdWorkstationMachineVO {
  id: number
  workstationId: number // 工作站 ID
  machineryId: number // 设备 ID
  machineryName: string // 设备名称
  machineryCode: string // 设备编码
  quantity: number // 数量
  remark: string // 备注
}

// MES 设备资源 API
export const MdWorkstationMachineApi = {
  // 查询设备资源列表
  getWorkstationMachineList: async (workstationId: number) => {
    return await request.get({
      url: `/mes/md-workstation-machine/list-by-workstation?workstationId=` + workstationId
    })
  },

  // 新增设备资源
  createWorkstationMachine: async (data: MdWorkstationMachineVO) => {
    return await request.post({ url: `/mes/md-workstation-machine/create`, data })
  },

  // 删除设备资源
  deleteWorkstationMachine: async (id: number) => {
    return await request.delete({ url: `/mes/md-workstation-machine/delete?id=` + id })
  }
}
