import request from '@/config/axios'

export interface SeckillConfigVO {
  id: number
  name: string
  startTime: string
  endTime: string
  sliderPicUrls: string[]
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

// 获得所有开启状态的秒杀时段精简列表
export const getSimpleSeckillConfigList = async () => {
  return await request.get({ url: '/promotion/seckill-config/list-all-simple' })
}

// 新增秒杀时段配置
export const createSeckillConfig = async (data: SeckillConfigVO) => {
  return await request.post({ url: '/promotion/seckill-config/create', data })
}

// 修改秒杀时段配置
export const updateSeckillConfig = async (data: SeckillConfigVO) => {
  return await request.put({ url: '/promotion/seckill-config/update', data })
}

// 修改时段配置状态
export const updateSeckillConfigStatus = (id: number, status: number) => {
  const data = {
    id,
    status
  }
  return request.put({ url: '/promotion/seckill-config/update-status', data: data })
}

// 删除秒杀时段配置
export const deleteSeckillConfig = async (id: number) => {
  return await request.delete({ url: '/promotion/seckill-config/delete?id=' + id })
}
