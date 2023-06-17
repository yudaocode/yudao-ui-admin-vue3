import request from '@/config/axios'

export interface SeckillConfigVO {
  id: number
  name: string
  startTime: Date
  endTime: Date
  seckillActivityCount: number
  picUrl: string
  status: number
}

// 查询秒杀时段配置列表
export const getSeckillConfigPage = async (params) => {
  return await request.get({ url: '/promotion/seckill-config/page', params })
}

// 查询秒杀时段配置详情
export const getSeckillConfig = async (id: number) => {
  return await request.get({ url: '/promotion/seckill-config/get?id=' + id })
}

// 新增秒杀时段配置
export const createSeckillConfig = async (data: SeckillConfigVO) => {
  return await request.post({ url: '/promotion/seckill-config/create', data })
}

// 修改秒杀时段配置
export const updateSeckillConfig = async (data: SeckillConfigVO) => {
  return await request.put({ url: '/promotion/seckill-config/update', data })
}

// 删除秒杀时段配置
export const deleteSeckillConfig = async (id: number) => {
  return await request.delete({ url: '/promotion/seckill-config/delete?id=' + id })
}

// 导出秒杀时段配置 Excel
export const exportSeckillConfigApi = async (params) => {
  return await request.download({ url: '/promotion/seckill-config/export-excel', params })
}
