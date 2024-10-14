import { CouponTemplateValidityTypeEnum, PromotionDiscountTypeEnum } from '@/utils/constants'
import { formatDate } from '@/utils/formatTime'
import { CouponTemplateVO } from '@/api/mall/promotion/coupon/couponTemplate'
import { floatToFixed2 } from '@/utils'

// 格式化【优惠金额/折扣】
export const discountFormat = (row: CouponTemplateVO) => {
  if (row.discountType === PromotionDiscountTypeEnum.PRICE.type) {
    return `￥${floatToFixed2(row.discountPrice)}`
  }
  if (row.discountType === PromotionDiscountTypeEnum.PERCENT.type) {
    return `${row.discountPercent}%`
  }
  return '未知【' + row.discountType + '】'
}

// 格式化【领取上限】
export const takeLimitCountFormat = (row: CouponTemplateVO) => {
  if (row.takeLimitCount) {
    if (row.takeLimitCount === -1) {
      return '无领取限制'
    }
    return `${row.takeLimitCount} 张/人`
  } else {
    return ' '
  }
}

// 格式化【有效期限】
export const validityTypeFormat = (row: CouponTemplateVO) => {
  if (row.validityType === CouponTemplateValidityTypeEnum.DATE.type) {
    return `${formatDate(row.validStartTime)} 至 ${formatDate(row.validEndTime)}`
  }
  if (row.validityType === CouponTemplateValidityTypeEnum.TERM.type) {
    return `领取后第 ${row.fixedStartTerm} - ${row.fixedEndTerm} 天内可用`
  }
  return '未知【' + row.validityType + '】'
}

// 格式化【totalCount】
export const totalCountFormat = (row: CouponTemplateVO) => {
  if (row.totalCount === -1) {
    return '不限制'
  }
  return row.totalCount
}

// 格式化【剩余数量】
export const remainedCountFormat = (row: CouponTemplateVO) => {
  if (row.totalCount === -1) {
    return '不限制'
  }
  return row.totalCount - row.takeCount
}

// 格式化【最低消费】
export const usePriceFormat = (row: CouponTemplateVO) => {
  return `￥${floatToFixed2(row.usePrice)}`
}
