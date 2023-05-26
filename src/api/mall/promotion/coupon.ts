import request from '@/config/axios'

// 删除优惠劵
export function deleteCoupon(id) {
  return request.delete({
    url: `/promotion/coupon/delete?id=${id}`
  })
}

// 获得优惠劵分页
export function getCouponPage(query) {
  return request.get({
    url: '/promotion/coupon/page',
    params: query
  })
}
