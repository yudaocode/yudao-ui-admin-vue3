import request from '@/config/axios'
import { Sku, Spu } from '@/api/mall/product/spu' // 积分商城活动 VO

// 积分商城活动 VO
export interface PointActivityVO {
  id: number // 积分商城活动编号
  spuId: number // 积分商城活动商品
  status: number // 活动状态
  stock: number // 积分商城活动库存
  totalStock: number // 积分商城活动总库存
  remark?: string // 备注
  sort: number // 排序
  createTime: string // 创建时间
  products: PointProductVO[] // 积分商城商品

  // ========== 商品字段 ==========
  spuName: string // 商品名称
  picUrl: string // 商品主图
  marketPrice: number // 商品市场价，单位：分

  //======================= 显示所需兑换积分最少的 sku 信息 =======================
  point: number // 兑换积分
  price: number // 兑换金额，单位：分
}

// 秒杀活动所需属性
export interface PointProductVO {
  id?: number // 积分商城商品编号
  activityId?: number // 积分商城活动 id
  spuId?: number // 商品 SPU 编号
  skuId: number // 商品 SKU 编号
  count: number // 可兑换数量
  point: number // 兑换积分
  price: number // 兑换金额，单位：分
  stock: number // 积分商城商品库存
  activityStatus?: number // 积分商城商品状态
}

// 扩展 Sku 配置
export type SkuExtension = Sku & {
  productConfig: PointProductVO
}

export interface SpuExtension extends Spu {
  skus: SkuExtension[] // 重写类型
}

export interface SpuExtension0 extends Spu {
  pointStock: number // 积分商城活动库存
  pointTotalStock: number // 积分商城活动总库存
  point: number // 兑换积分
  pointPrice: number // 兑换金额，单位：分
}

// 积分商城活动 API
export const PointActivityApi = {
  // 查询积分商城活动分页
  getPointActivityPage: async (params: any) => {
    return await request.get({ url: `/promotion/point-activity/page`, params })
  },

  // 查询积分商城活动详情
  getPointActivity: async (id: number) => {
    return await request.get({ url: `/promotion/point-activity/get?id=` + id })
  },

  // 查询积分商城活动列表，基于活动编号数组
  getPointActivityListByIds: async (ids: number[]) => {
    return request.get({ url: `/promotion/point-activity/list-by-ids?ids=${ids}` })
  },

  // 新增积分商城活动
  createPointActivity: async (data: PointActivityVO) => {
    return await request.post({ url: `/promotion/point-activity/create`, data })
  },

  // 修改积分商城活动
  updatePointActivity: async (data: PointActivityVO) => {
    return await request.put({ url: `/promotion/point-activity/update`, data })
  },

  // 删除积分商城活动
  deletePointActivity: async (id: number) => {
    return await request.delete({ url: `/promotion/point-activity/delete?id=` + id })
  },

  // 关闭秒杀活动
  closePointActivity: async (id: number) => {
    return await request.put({ url: '/promotion/point-activity/close?id=' + id })
  }
}
