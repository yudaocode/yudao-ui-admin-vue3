import request from '@/config/axios'

/** 用户钱包查询参数 */
export interface PayWalletUserReqVO {
  userId: number
  userType: number
}
/** 钱包 VO */
export interface WalletVO {
  id: number
  userId: number
  userType: number
  balance: number
  totalExpense: number
  totalRecharge: number
  freezePrice: number
}

/** 查询用户钱包详情 */
export const getUserWallet = async (params: PayWalletUserReqVO) => {
  return await request.get<WalletVO>({ url: `/pay/wallet/user-wallet`, params })
}
