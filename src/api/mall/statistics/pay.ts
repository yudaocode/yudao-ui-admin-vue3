import request from '@/config/axios'

/** 支付统计 */
export interface PaySummaryRespVO {
  /** 充值金额，单位分 */
  rechargePrice: number
}

/** 获取钱包充值金额 */
export const getWalletRechargePrice = async () => {
  return await request.get<PaySummaryRespVO>({ url: `/statistics/pay/summary` })
}
