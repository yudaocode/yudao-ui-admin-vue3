import request from '@/config/axios'

export interface CouponTemplateVO {
  id: number
  name: string
  status: number
  totalCount: number
  takeLimitCount: number
  takeType: number
  usePrice: number
  productScope: number
  productScopeValues: number[]
  validityType: number
  validStartTime: Date
  validEndTime: Date
  fixedStartTerm: number
  fixedEndTerm: number
  discountType: number
  discountPercent: number
  discountPrice: number
  discountLimitPrice: number
  takeCount: number
  useCount: number
}

// 创建优惠劵模板
export function createCouponTemplate(data: CouponTemplateVO) {
  return request.post({
    url: '/promotion/coupon-template/create',
    data: data
  })
}

// 更新优惠劵模板
export function updateCouponTemplate(data: CouponTemplateVO) {
  return request.put({
    url: '/promotion/coupon-template/update',
    data: data
  })
}

// 更新优惠劵模板的状态
export function updateCouponTemplateStatus(id: number, status: [0, 1]) {
  const data = {
    id,
    status
  }
  return request.put({
    url: '/promotion/coupon-template/update-status',
    data: data
  })
}

// 删除优惠劵模板
export function deleteCouponTemplate(id: number) {
  return request.delete({
    url: '/promotion/coupon-template/delete?id=' + id
  })
}

// 获得优惠劵模板
export function getCouponTemplate(id: number) {
  return request.get({
    url: '/promotion/coupon-template/get?id=' + id
  })
}

// 获得优惠劵模板分页
export function getCouponTemplatePage(params: PageParam) {
  return request.get({
    url: '/promotion/coupon-template/page',
    params: params
  })
}

// 获得优惠劵模板分页
export function getCouponTemplateList(ids: number[]) {
  return request.get({
    url: `/promotion/coupon-template/list?ids=${ids}`
  })
}

// 导出优惠劵模板 Excel
export function exportCouponTemplateExcel(params: PageParam) {
  return request.get({
    url: '/promotion/coupon-template/export-excel',
    params: params,
    responseType: 'blob'
  })
}
