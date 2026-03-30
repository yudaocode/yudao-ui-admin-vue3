import request from '@/config/axios'

// MES 工装夹具资源 VO
export interface MdWorkstationToolVO {
  id: number
  workstationId: number // 工作站 ID
  toolTypeId: number // 工具类型 ID
  toolTypeName: string // 工具类型名称
  quantity: number // 数量
  remark: string // 备注
}

// MES 工装夹具资源 API
export const MdWorkstationToolApi = {
  // 查询工装夹具资源列表
  getWorkstationToolList: async (workstationId: number) => {
    return await request.get({
      url: `/mes/md-workstation-tool/list-by-workstation?workstationId=` + workstationId
    })
  },

  // 新增工装夹具资源
  createWorkstationTool: async (data: MdWorkstationToolVO) => {
    return await request.post({ url: `/mes/md-workstation-tool/create`, data })
  },

  // 修改工装夹具资源
  updateWorkstationTool: async (data: MdWorkstationToolVO) => {
    return await request.put({ url: `/mes/md-workstation-tool/update`, data })
  },

  // 删除工装夹具资源
  deleteWorkstationTool: async (id: number) => {
    return await request.delete({ url: `/mes/md-workstation-tool/delete?id=` + id })
  }
}
