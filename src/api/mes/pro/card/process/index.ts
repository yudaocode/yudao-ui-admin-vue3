import request from '@/config/axios'

// MES 流转卡工序记录 VO
export interface ProCardProcessVO {
  id: number // 编号
  cardId: number // 流转卡编号
  sort: number // 序号
  processId: number // 工序编号
  processCode: string // 工序编码
  processName: string // 工序名称
  inputTime: Date // 进入工序时间
  outputTime: Date // 出工序时间
  inputQuantity: number // 投入数量
  outputQuantity: number // 产出数量
  unqualifiedQuantity: number // 不合格品数量
  workstationId: number // 工位编号
  workstationCode: string // 工位编码
  workstationName: string // 工位名称
  userId: number // 操作人编号
  nickname: string // 操作人名称
  ipqcId: number // 过程检验单编号
  remark: string // 备注
}

// MES 流转卡工序记录 API
export const ProCardProcessApi = {
  // 查询流转卡工序记录分页
  getCardProcessPage: async (params: any) => {
    return await request.get({ url: `/mes/pro/card-process/page`, params })
  },

  // 查询流转卡工序记录详情
  getCardProcess: async (id: number) => {
    return await request.get({ url: `/mes/pro/card-process/get?id=` + id })
  },

  // 新增流转卡工序记录
  createCardProcess: async (data: ProCardProcessVO) => {
    return await request.post({ url: `/mes/pro/card-process/create`, data })
  },

  // 修改流转卡工序记录
  updateCardProcess: async (data: ProCardProcessVO) => {
    return await request.put({ url: `/mes/pro/card-process/update`, data })
  },

  // 删除流转卡工序记录
  deleteCardProcess: async (id: number) => {
    return await request.delete({ url: `/mes/pro/card-process/delete?id=` + id })
  }
}
