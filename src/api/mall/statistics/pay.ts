import request from '@/config/axios'

/** 获取钱包充值金额 */
export const getWalletRechargePrice = async () => {
  return await request.get<number>({ url: `/statistics/pay/wallet-recharge-price` })
}
