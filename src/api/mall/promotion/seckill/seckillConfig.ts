import request from '@/config/axios'

// 秒杀时段 VO
export interface SeckillConfigVO {
  id: number // 编号
  name: string // 秒杀时段名称
  startTime: string // 开始时间点
  endTime: string // 结束时间点
  sliderPicUrls: string[] // 秒杀轮播图
  status: number // 活动状态
}

// 秒杀时段 API
export const SeckillConfigApi = {
  // 查询秒杀时段分页
  getSeckillConfigPage: async (params: any) => {
    return await request.get({ url: `/promotion/seckill-config/page`, params })
  },

  // 查询秒杀时段列表
  getSimpleSeckillConfigList: async () => {
    return await request.get({ url: `/promotion/seckill-config/list` })
  },

  // 查询秒杀时段详情
  getSeckillConfig: async (id: number) => {
    return await request.get({ url: `/promotion/seckill-config/get?id=` + id })
  },

  // 新增秒杀时段
  createSeckillConfig: async (data: SeckillConfigVO) => {
    return await request.post({ url: `/promotion/seckill-config/create`, data })
  },

  // 修改秒杀时段
  updateSeckillConfig: async (data: SeckillConfigVO) => {
    return await request.put({ url: `/promotion/seckill-config/update`, data })
  },

  // 删除秒杀时段
  deleteSeckillConfig: async (id: number) => {
    return await request.delete({ url: `/promotion/seckill-config/delete?id=` + id })
  },

  // 修改时段配置状态
  updateSeckillConfigStatus: async (id: number, status: number) => {
    const data = {
      id,
      status
    }
    return request.put({ url: '/promotion/seckill-config/update-status', data: data })
  }
}
