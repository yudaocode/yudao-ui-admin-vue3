import request from '@/config/axios'

// MES 人力资源 VO
export interface MdWorkstationWorkerVO {
  id: number
  workstationId: number // 工作站 ID
  postId: number // 岗位 ID
  postName: string // 岗位名称
  quantity: number // 数量
  remark: string // 备注
}

// MES 人力资源 API
export const MdWorkstationWorkerApi = {
  // 查询人力资源列表
  getWorkstationWorkerList: async (workstationId: number) => {
    return await request.get({ url: `/mes/md-workstation-worker/list-by-workstation?workstationId=` + workstationId })
  },

  // 新增人力资源
  createWorkstationWorker: async (data: MdWorkstationWorkerVO) => {
    return await request.post({ url: `/mes/md-workstation-worker/create`, data })
  },

  // 修改人力资源
  updateWorkstationWorker: async (data: MdWorkstationWorkerVO) => {
    return await request.put({ url: `/mes/md-workstation-worker/update`, data })
  },

  // 删除人力资源
  deleteWorkstationWorker: async (id: number) => {
    return await request.delete({ url: `/mes/md-workstation-worker/delete?id=` + id })
  }
}
