import request from '@/config/axios'

/** 优惠劵（会员领取记录） VO */
export interface CouponVO {
  id: number // 优惠劵编号
  name: string // 优惠劵名
  nickname: string // 会员昵称
  productScope: number // 商品范围
  discountType: number // 折扣类型
  discountPercent: number // 折扣百分比
  discountPrice: number // 优惠金额，单位：分
  takeType: number // 领取方式
  status: number // 优惠劵状态
  useTime?: Date // 使用时间
  createTime: Date // 领取时间
}

// TODO @dhb52：vo 缺少

// 删除优惠劵
export const deleteCoupon = async (id: number) => {
  return request.delete({
    url: `/promotion/coupon/delete?id=${id}`
  })
}

// 获得优惠劵分页
export const getCouponPage = async (params: PageParam) => {
  return request.get({
    url: '/promotion/coupon/page',
    params: params
  })
}

// 发送优惠券
export const sendCoupon = async (data: any) => {
  return request.post({
    url: '/promotion/coupon/send',
    data: data
  })
}
